import { useCallback, useEffect, useRef, useState } from "react"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { mintLiveVoiceTokenFn } from "@/server/live-voice"
import type {
	LivePlaybackFormat,
	LiveVoiceState,
	LiveVoiceStatus,
	LiveVoiceTarget,
	UseLiveVoiceReturn,
} from "@/types/chat"
import type { LiveVoiceDownMessage } from "@/types/live"

const CAPTURE_SAMPLE_RATE = 16000
const DEFAULT_PLAYBACK_SAMPLE_RATE = 24000
const DEFAULT_PLAYBACK_CHANNELS = 1

export const liveVoiceStatusLabel = (status: LiveVoiceStatus): string => {
	if (status === "connecting") return m.chat_live_status_connecting()
	if (status === "ready" || status === "listening")
		return m.chat_live_status_listening()
	if (status === "thinking") return m.chat_live_status_thinking()
	if (status === "speaking") return m.chat_live_status_speaking()
	if (status === "error") return m.chat_live_status_error()
	return m.chat_live_status_idle()
}

const micErrorText = (err: unknown): string => {
	if (!(err instanceof Error)) return m.chat_live_mic_failed()
	if (err.name === "NotAllowedError" || err.name === "SecurityError")
		return m.chat_live_mic_denied()
	if (err.name === "NotFoundError" || err.name === "NotSupportedError")
		return m.chat_live_unsupported()
	return m.chat_live_mic_failed()
}

const parseDownMessage = (raw: string): LiveVoiceDownMessage | null => {
	try {
		const parsed: unknown = JSON.parse(raw)
		if (typeof parsed !== "object" || parsed === null) return null
		if (typeof (parsed as { type?: unknown }).type !== "string") return null
		return parsed as LiveVoiceDownMessage
	} catch {
		return null
	}
}

const idleState = (): LiveVoiceState => ({
	status: "idle",
	transcript: "",
	reply: "",
	error: null,
})

export const useLiveVoice = (target: LiveVoiceTarget): UseLiveVoiceReturn => {
	const [state, setState] = useState<LiveVoiceState>(idleState)

	const satelliteIdRef = useRef(`web-console-${crypto.randomUUID()}`)
	const wsRef = useRef<WebSocket | null>(null)
	const captureCtxRef = useRef<AudioContext | null>(null)
	const playbackCtxRef = useRef<AudioContext | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const workletRef = useRef<AudioWorkletNode | null>(null)
	const listeningRef = useRef(false)
	const playHeadRef = useRef(0)
	const pausedRef = useRef(false)
	const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set())
	const streamEndedRef = useRef(false)
	const playedSentRef = useRef(false)
	const interactionIdRef = useRef<string | null>(null)
	const playFmtRef = useRef<LivePlaybackFormat>({
		sampleRate: DEFAULT_PLAYBACK_SAMPLE_RATE,
		channels: DEFAULT_PLAYBACK_CHANNELS,
	})

	const patch = useCallback((fields: Partial<LiveVoiceState>) => {
		setState((prev) => ({ ...prev, ...fields }))
	}, [])

	const stopScheduled = useCallback(() => {
		for (const source of sourcesRef.current) {
			source.onended = null
			source.stop()
			source.disconnect()
		}
		sourcesRef.current.clear()
	}, [])

	const reportAudioPlayed = useCallback(() => {
		if (pausedRef.current || playedSentRef.current) return
		if (!streamEndedRef.current || sourcesRef.current.size > 0) return
		const interactionId = interactionIdRef.current
		const ws = wsRef.current
		if (!interactionId || ws?.readyState !== WebSocket.OPEN) return
		playedSentRef.current = true
		ws.send(JSON.stringify({ type: "audio_played", interactionId }))
	}, [])

	const playFrame = useCallback(
		(pcm: ArrayBuffer) => {
			const ctx = playbackCtxRef.current
			if (!ctx || pausedRef.current) return
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
			source.onended = () => {
				sourcesRef.current.delete(source)
				reportAudioPlayed()
			}
			const startAt = Math.max(ctx.currentTime, playHeadRef.current)
			sourcesRef.current.add(source)
			source.start(startAt)
			playHeadRef.current = startAt + buffer.duration
		},
		[reportAudioPlayed],
	)

	const teardown = useCallback(() => {
		listeningRef.current = false
		pausedRef.current = false
		streamEndedRef.current = false
		playedSentRef.current = false
		interactionIdRef.current = null
		stopScheduled()
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
	}, [stopScheduled])

	const handleMessage = useCallback(
		(msg: LiveVoiceDownMessage) => {
			if (msg.type === "ready") {
				void captureCtxRef.current?.resume()
				void playbackCtxRef.current?.resume()
				listeningRef.current = true
				patch({ status: "listening", transcript: "", reply: "" })
			} else if (msg.type === "transcript") {
				patch({ transcript: msg.text })
			} else if (msg.type === "speech_stopped") {
				listeningRef.current = false
				patch({ status: "thinking" })
			} else if (msg.type === "audio_stream_begin") {
				playFmtRef.current = {
					sampleRate: msg.sampleRate ?? DEFAULT_PLAYBACK_SAMPLE_RATE,
					channels: msg.channels ?? DEFAULT_PLAYBACK_CHANNELS,
				}
				pausedRef.current = false
				streamEndedRef.current = false
				playedSentRef.current = false
				interactionIdRef.current = msg.interactionId ?? null
				playHeadRef.current = playbackCtxRef.current?.currentTime ?? 0
				patch({ status: "speaking" })
			} else if (msg.type === "audio_pause") {
				pausedRef.current = true
				stopScheduled()
				playHeadRef.current = playbackCtxRef.current?.currentTime ?? 0
			} else if (msg.type === "audio_resume") {
				pausedRef.current = false
				playHeadRef.current = playbackCtxRef.current?.currentTime ?? 0
			} else if (msg.type === "audio_stream_end") {
				streamEndedRef.current = true
				listeningRef.current = true
				reportAudioPlayed()
				patch({ status: "listening" })
			} else if (msg.type === "reply_done") {
				interactionIdRef.current ??= msg.interactionId ?? null
				reportAudioPlayed()
				patch({ reply: msg.reply })
			} else {
				patch({ status: "error", error: msg.message })
			}
		},
		[patch, reportAudioPlayed, stopScheduled],
	)

	const connect = useCallback(async () => {
		patch({ status: "connecting", error: null, transcript: "", reply: "" })
		const granted = await mintLiveVoiceTokenFn({
			data: {
				domiaKey: target.domiaKey,
				satelliteId: satelliteIdRef.current,
			},
		})
		if (!granted.ok) {
			patch({ status: "error", error: errText(granted.error) })
			return
		}
		const grant = granted.data
		if (!grant) {
			patch({ status: "error", error: m.chat_live_token_failed() })
			return
		}
		try {
			if (!navigator.mediaDevices?.getUserMedia) {
				patch({ status: "error", error: m.chat_live_unsupported() })
				return
			}
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

			const ws = new WebSocket(grant.wsUrl)
			ws.binaryType = "arraybuffer"
			wsRef.current = ws

			ws.onopen = () => {
				ws.send(
					JSON.stringify({
						type: "hello",
						satelliteId: grant.satelliteId,
						domiaKey: grant.domiaKey,
						token: grant.token,
						sampleRate: CAPTURE_SAMPLE_RATE,
						channels: DEFAULT_PLAYBACK_CHANNELS,
					}),
				)
			}
			ws.onmessage = (event: MessageEvent<ArrayBuffer | string>) => {
				if (event.data instanceof ArrayBuffer) {
					playFrame(event.data)
					return
				}
				const msg = parseDownMessage(String(event.data))
				if (msg) handleMessage(msg)
			}
			ws.onerror = () =>
				patch({ status: "error", error: m.chat_live_status_error() })
			ws.onclose = () => {
				if (wsRef.current !== ws) return
				teardown()
				patch({ status: "error", error: m.chat_live_status_error() })
			}
		} catch (err) {
			teardown()
			patch({ status: "error", error: micErrorText(err) })
		}
	}, [target.domiaKey, patch, playFrame, handleMessage, teardown])

	const disconnect = useCallback(() => {
		teardown()
		setState(idleState())
	}, [teardown])

	useEffect(() => () => teardown(), [teardown])

	const targetSig = `${target.domiaKey}|${target.localIp ?? ""}|${target.httpPort ?? ""}`
	const prevTargetSig = useRef(targetSig)
	useEffect(() => {
		if (prevTargetSig.current === targetSig) return
		prevTargetSig.current = targetSig
		teardown()
		setState(idleState())
	}, [targetSig, teardown])

	const connected =
		state.status !== "idle" &&
		state.status !== "connecting" &&
		state.status !== "error"

	return { state, connect, disconnect, connected }
}
