import { useCallback, useEffect, useRef, useState } from "react"
import type {
	LiveVoiceState,
	LiveVoiceStatus,
	LiveVoiceTarget,
} from "@/types/chat"

const CAPTURE_SAMPLE_RATE = 16000

const wsUrlFor = (target: LiveVoiceTarget): string | null => {
	if (!target.localIp || !target.httpPort) return null
	const scheme = window.location.protocol === "https:" ? "wss" : "ws"
	return `${scheme}://${target.localIp}:${target.httpPort}/satellite?live=1`
}

export const useLiveVoice = (target: LiveVoiceTarget) => {
	const [state, setState] = useState<LiveVoiceState>({
		status: "idle",
		transcript: "",
		reply: "",
		error: null,
	})

	const satelliteIdRef = useRef(`web-console-${crypto.randomUUID()}`)
	const wsRef = useRef<WebSocket | null>(null)
	const captureCtxRef = useRef<AudioContext | null>(null)
	const playbackCtxRef = useRef<AudioContext | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const workletRef = useRef<AudioWorkletNode | null>(null)
	const listeningRef = useRef(false)
	const playHeadRef = useRef(0)
	const playFmtRef = useRef<{ sampleRate: number; channels: number }>({
		sampleRate: 24000,
		channels: 1,
	})

	const patch = useCallback((fields: Partial<LiveVoiceState>) => {
		setState((prev) => ({ ...prev, ...fields }))
	}, [])

	const playFrame = useCallback((pcm: ArrayBuffer) => {
		const ctx = playbackCtxRef.current
		if (!ctx) return
		const { sampleRate, channels } = playFmtRef.current
		const int16 = new Int16Array(pcm)
		const frames = Math.floor(int16.length / channels)
		if (frames === 0) return
		const buffer = ctx.createBuffer(channels, frames, sampleRate)
		for (let ch = 0; ch < channels; ch++) {
			const data = buffer.getChannelData(ch)
			for (let i = 0; i < frames; i++) {
				data[i] = int16[i * channels + ch] / 0x8000
			}
		}
		const source = ctx.createBufferSource()
		source.buffer = buffer
		source.connect(ctx.destination)
		const startAt = Math.max(ctx.currentTime, playHeadRef.current)
		source.start(startAt)
		playHeadRef.current = startAt + buffer.duration
	}, [])

	const teardown = useCallback(() => {
		listeningRef.current = false
		wsRef.current?.close()
		wsRef.current = null
		workletRef.current?.disconnect()
		workletRef.current = null
		streamRef.current?.getTracks().forEach((t) => t.stop())
		streamRef.current = null
		void captureCtxRef.current?.close()
		captureCtxRef.current = null
		void playbackCtxRef.current?.close()
		playbackCtxRef.current = null
	}, [])

	const connect = useCallback(async () => {
		const url = wsUrlFor(target)
		if (!url) {
			patch({ status: "error", error: "Domia address unknown" })
			return
		}
		patch({ status: "connecting", error: null, transcript: "", reply: "" })
		try {
			const stream = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
					autoGainControl: true,
				},
			})
			streamRef.current = stream

			const captureCtx = new AudioContext({ sampleRate: CAPTURE_SAMPLE_RATE })
			captureCtxRef.current = captureCtx
			await captureCtx.audioWorklet.addModule("/pcm-capture-worklet.js")
			const source = captureCtx.createMediaStreamSource(stream)
			const worklet = new AudioWorkletNode(captureCtx, "pcm-capture")
			worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => {
				if (
					listeningRef.current &&
					wsRef.current?.readyState === WebSocket.OPEN
				) {
					wsRef.current.send(event.data)
				}
			}
			const mute = captureCtx.createGain()
			mute.gain.value = 0
			source.connect(worklet)
			worklet.connect(mute)
			mute.connect(captureCtx.destination)
			workletRef.current = worklet

			playbackCtxRef.current = new AudioContext()

			const ws = new WebSocket(url)
			ws.binaryType = "arraybuffer"
			wsRef.current = ws

			ws.onopen = () => {
				ws.send(
					JSON.stringify({
						type: "hello",
						satelliteId: satelliteIdRef.current,
						domiaKey: target.domiaKey,
						sampleRate: CAPTURE_SAMPLE_RATE,
						channels: 1,
					}),
				)
			}
			ws.onmessage = (event) => {
				if (event.data instanceof ArrayBuffer) {
					playFrame(event.data)
					return
				}
				const msg = JSON.parse(String(event.data))
				if (msg.type === "ready") {
					void captureCtxRef.current?.resume()
					void playbackCtxRef.current?.resume()
					listeningRef.current = true
					patch({ status: "listening", transcript: "", reply: "" })
				} else if (msg.type === "transcript") {
					patch({ transcript: msg.text })
				} else if (msg.type === "speech_end") {
					listeningRef.current = false
					patch({ status: "thinking" })
				} else if (msg.type === "audio_stream_begin") {
					playFmtRef.current = {
						sampleRate: msg.sampleRate ?? 24000,
						channels: msg.channels ?? 1,
					}
					playHeadRef.current = playbackCtxRef.current?.currentTime ?? 0
					patch({ status: "speaking" })
				} else if (msg.type === "audio_stream_end") {
					listeningRef.current = true
					patch({ status: "listening" })
				} else if (msg.type === "reply_done") {
					patch({ reply: msg.reply })
				} else if (msg.type === "error") {
					patch({ status: "error", error: msg.message })
				}
			}
			ws.onerror = () => patch({ status: "error", error: "connection error" })
			ws.onclose = () => {
				if (wsRef.current !== ws) return
				teardown()
				patch({ status: "error", error: "connection lost" })
			}
		} catch (err) {
			teardown()
			patch({
				status: "error",
				error: err instanceof Error ? err.message : "mic/connection failed",
			})
		}
	}, [target, patch, playFrame, teardown])

	const disconnect = useCallback(() => {
		teardown()
		setState({ status: "idle", transcript: "", reply: "", error: null })
	}, [teardown])

	useEffect(() => () => teardown(), [teardown])

	const targetSig = `${target.domiaKey}|${target.localIp ?? ""}|${target.httpPort ?? ""}`
	const prevTargetSig = useRef(targetSig)
	useEffect(() => {
		if (prevTargetSig.current === targetSig) return
		prevTargetSig.current = targetSig
		teardown()
		setState({ status: "idle", transcript: "", reply: "", error: null })
	}, [targetSig, teardown])

	const connected =
		state.status !== "idle" &&
		state.status !== "connecting" &&
		state.status !== "error"

	return { state, connect, disconnect, connected }
}

export type UseLiveVoiceReturn = ReturnType<typeof useLiveVoice>

export const liveVoiceStatusLabel: Record<LiveVoiceStatus, string> = {
	idle: "Off",
	connecting: "Connecting…",
	ready: "Listening…",
	listening: "Listening…",
	thinking: "Thinking…",
	speaking: "Speaking…",
	error: "Error",
}
