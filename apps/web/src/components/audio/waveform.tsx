import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react"
import WaveSurfer from "wavesurfer.js"
import { Pause, Play } from "lucide-react"
import { clock } from "@/utils/format"
import { cn } from "@/lib/utils"
import type { WaveformHandle, WaveformProps } from "@/types"

const PLAYBACK_SPEEDS = [1, 1.5, 2]

const readVar = (el: HTMLElement, name: string, fallback: string) => {
	const v = getComputedStyle(el).getPropertyValue(name).trim()
	return v || fallback
}

export const Waveform = forwardRef<WaveformHandle, WaveformProps>(
	function Waveform(
		{
			src,
			accent = "primary",
			height = 40,
			showSpeed = false,
			className,
			onReady,
			onFinish,
			onProgress,
		},
		ref,
	) {
		const containerRef = useRef<HTMLDivElement | null>(null)
		const wsRef = useRef<WaveSurfer | null>(null)
		const [ready, setReady] = useState(false)
		const [playing, setPlaying] = useState(false)
		const [current, setCurrent] = useState(0)
		const [duration, setDuration] = useState(0)
		const [speedIndex, setSpeedIndex] = useState(0)

		const cbs = useRef({ onReady, onFinish, onProgress })
		cbs.current = { onReady, onFinish, onProgress }

		useImperativeHandle(
			ref,
			() => ({
				play: () => void wsRef.current?.play(),
				pause: () => wsRef.current?.pause(),
				restart: () => void wsRef.current?.play(0),
			}),
			[],
		)

		useEffect(() => {
			const el = containerRef.current
			if (!el) return
			const progressVar = accent === "input" ? "--chart-3" : "--primary"
			const ws = WaveSurfer.create({
				container: el,
				height,
				waveColor: readVar(el, "--muted-foreground", "oklch(0.5 0.05 260)"),
				progressColor: readVar(el, progressVar, "oklch(0.3 0.17 260)"),
				cursorColor: readVar(el, "--foreground", "oklch(0.14 0.05 265)"),
				cursorWidth: 1,
				barWidth: 2,
				barGap: 2,
				barRadius: 2,
				normalize: true,
				url: src,
			})
			wsRef.current = ws
			ws.on("ready", () => {
				setReady(true)
				setDuration(ws.getDuration())
				cbs.current.onReady?.(ws.getDuration())
			})
			ws.on("play", () => setPlaying(true))
			ws.on("pause", () => setPlaying(false))
			ws.on("finish", () => {
				setPlaying(false)
				cbs.current.onFinish?.()
			})
			ws.on("timeupdate", (t: number) => {
				setCurrent(t)
				cbs.current.onProgress?.(t)
			})
			return () => {
				ws.destroy()
				wsRef.current = null
				setReady(false)
				setPlaying(false)
				setCurrent(0)
			}
		}, [src, accent, height])

		const cycleSpeed = () => {
			const next = (speedIndex + 1) % PLAYBACK_SPEEDS.length
			setSpeedIndex(next)
			wsRef.current?.setPlaybackRate(PLAYBACK_SPEEDS[next], true)
		}

		return (
			<div className={cn("flex items-center gap-3", className)}>
				<button
					type="button"
					onClick={(e) => {
						e.stopPropagation()
						wsRef.current?.playPause()
					}}
					disabled={!ready}
					aria-label={playing ? "Pause" : "Play"}
					className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 disabled:opacity-50"
				>
					{playing ? (
						<Pause className="size-4" />
					) : (
						<Play className="size-4 translate-x-px" />
					)}
				</button>

				<div ref={containerRef} className="min-w-0 flex-1" />

				<span className="text-muted-foreground shrink-0 font-mono text-xs tabular-nums">
					{clock(current)} / {clock(duration)}
				</span>

				{showSpeed && (
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							cycleSpeed()
						}}
						className="text-muted-foreground hover:text-foreground shrink-0 font-mono text-xs tabular-nums"
						aria-label="Playback speed"
					>
						{PLAYBACK_SPEEDS[speedIndex]}x
					</button>
				)}
			</div>
		)
	},
)
