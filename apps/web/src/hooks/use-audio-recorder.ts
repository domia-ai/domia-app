import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { blobToWav16kBase64 } from "@/lib/wav-encode"
import type { AudioRecorderControls } from "@/types/chat"

export function useAudioRecorder(
	onClip: (base64: string) => void,
): AudioRecorderControls {
	const [recording, setRecording] = useState(false)
	const [converting, setConverting] = useState(false)
	const [seconds, setSeconds] = useState(0)
	const [level, setLevel] = useState(0)

	const onClipRef = useRef(onClip)
	onClipRef.current = onClip
	const recorderRef = useRef<MediaRecorder | null>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const meterRef = useRef<ReturnType<typeof setInterval> | null>(null)
	const audioCtxRef = useRef<AudioContext | null>(null)

	const teardownMeters = useCallback(() => {
		if (timerRef.current) {
			clearInterval(timerRef.current)
			timerRef.current = null
		}
		if (meterRef.current) {
			clearInterval(meterRef.current)
			meterRef.current = null
		}
		void audioCtxRef.current?.close().catch(() => undefined)
		audioCtxRef.current = null
		setLevel(0)
	}, [])

	useEffect(
		() => () => {
			teardownMeters()
			const rec = recorderRef.current
			if (rec && rec.state !== "inactive") {
				rec.onstop = null
				rec.stop()
			}
			for (const track of streamRef.current?.getTracks() ?? []) track.stop()
			streamRef.current = null
		},
		[teardownMeters],
	)

	const attachMeter = useCallback((stream: MediaStream) => {
		try {
			const ctx = new AudioContext()
			audioCtxRef.current = ctx
			const analyser = ctx.createAnalyser()
			analyser.fftSize = 256
			ctx.createMediaStreamSource(stream).connect(analyser)
			const data = new Uint8Array(analyser.frequencyBinCount)
			meterRef.current = setInterval(() => {
				analyser.getByteTimeDomainData(data)
				let sum = 0
				for (const v of data) {
					const x = (v - 128) / 128
					sum += x * x
				}
				setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3.2))
			}, 90)
		} catch {
			setLevel(0)
		}
	}, [])

	const start = useCallback(async () => {
		if (recording) return
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			streamRef.current = stream
			const recorder = new MediaRecorder(stream)
			chunksRef.current = []
			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data)
			}
			recorder.onstop = async () => {
				for (const track of stream.getTracks()) track.stop()
				streamRef.current = null
				teardownMeters()
				setRecording(false)
				setSeconds(0)
				const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
				if (blob.size === 0) return
				setConverting(true)
				try {
					onClipRef.current(await blobToWav16kBase64(blob))
				} catch {
					toast.error("Could not process the recording")
				} finally {
					setConverting(false)
				}
			}
			recorderRef.current = recorder
			recorder.start()
			setRecording(true)
			setSeconds(0)
			timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
			attachMeter(stream)
		} catch {
			toast.error("Microphone access was denied")
		}
	}, [recording, attachMeter, teardownMeters])

	const stop = useCallback(() => recorderRef.current?.stop(), [])

	return { recording, converting, seconds, level, start, stop }
}
