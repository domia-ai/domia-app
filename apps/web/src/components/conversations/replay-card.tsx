import { useEffect, useRef, useState } from "react"
import { Pause, Play, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { clock, formatMs } from "@/utils/format"
import { buildLatency } from "@/utils/latency"
import { useReplayController, useReplaySet } from "./replay-provider"
import type {
	LatencyStepKey,
	PipelineStepKey,
	ReplayCardProps,
	ReplayCell,
	ReplayPhase,
} from "@/types/conversations"

const STEP_BG: Record<LatencyStepKey, string> = {
	stt: "bg-chart-1",
	llm: "bg-chart-2",
	tts: "bg-chart-3",
}

const PHASE_LABEL: Record<ReplayPhase, string> = {
	idle: "",
	input: "Listening",
	processing: "Thinking",
	response: "Speaking",
	done: "",
}

export function ReplayCard({ trace, inputSrc, ttsSrc }: ReplayCardProps) {
	const data = buildLatency(trace)
	const controller = useReplayController()
	const raf = useRef<number | null>(null)
	const procStartedAt = useRef<number>(0)
	const procElapsedRef = useRef<number>(0)
	const [mounted, setMounted] = useState(false)
	const [phase, setPhase] = useState<ReplayPhase>("idle")
	const [running, setRunning] = useState(false)
	const [procElapsed, setProcElapsedState] = useState(0)
	const [inputDur, setInputDur] = useState(0)
	const [ttsDur, setTtsDur] = useState(0)
	const [inputCur, setInputCur] = useState(0)
	const [ttsCur, setTtsCur] = useState(0)

	useEffect(() => setMounted(true), [])

	useEffect(() => {
		controller.setSink({
			onReady: (kind, d) => {
				if (kind === "input") setInputDur(d)
				else setTtsDur(d)
			},
			onFinish: (kind) => {
				if (kind === "input") {
					setProcElapsed(0)
					setPhase("processing")
					setRunning(true)
				} else {
					setPhase("done")
					setRunning(false)
				}
			},
			onProgress: (kind, t) => {
				if (kind === "input") setInputCur(t)
				else setTtsCur(t)
			},
		})
		return () => controller.setSink({})
	}, [controller])

	const hasInput = !!inputSrc
	const hasTts = !!ttsSrc
	const stepSumMs = data ? data.steps.reduce((sum, s) => sum + s.ms, 0) : 0
	const waitMs = data
		? (data.ttfaMs ?? (stepSumMs > 0 ? stepSumMs : data.totalMs))
		: 0
	const procScale = stepSumMs > 0 ? waitMs / stepSumMs : 1

	const setProcElapsed = (v: number) => {
		procElapsedRef.current = v
		setProcElapsedState(v)
	}

	useEffect(() => {
		if (phase !== "processing" || !running) return
		procStartedAt.current = performance.now() - procElapsedRef.current
		const tick = (now: number) => {
			const e = now - procStartedAt.current
			if (e >= waitMs) {
				setProcElapsed(waitMs)
				if (hasTts) {
					setPhase("response")
					controller.getTrack("tts")?.restart()
				} else {
					setPhase("done")
					setRunning(false)
				}
				return
			}
			setProcElapsed(e)
			raf.current = requestAnimationFrame(tick)
		}
		raf.current = requestAnimationFrame(tick)
		return () => {
			if (raf.current) cancelAnimationFrame(raf.current)
		}
	}, [phase, running, waitMs, hasTts])

	const replaySet = useReplaySet()
	const activeStepKey: PipelineStepKey | null =
		phase === "input"
			? "input"
			: phase === "response"
				? "tts"
				: phase === "processing" && data
					? (() => {
							let cum = 0
							for (const s of data.steps) {
								const dur = s.ms * procScale
								if (procElapsed >= cum && procElapsed < cum + dur)
									return s.key === "stt"
										? "stt"
										: s.key === "llm"
											? "llmResponse"
											: "tts"
								cum += dur
							}
							return null
						})()
					: null
	useEffect(() => {
		replaySet({ phase, activeStepKey, running })
	}, [phase, activeStepKey, running, replaySet])

	if (!data) return null

	const ready =
		(!hasInput || inputDur > 0) && (!hasTts || ttsDur > 0) && mounted

	const start = () => {
		setProcElapsed(0)
		setTtsCur(0)
		if (hasInput) {
			setPhase("input")
			setRunning(true)
			controller.getTrack("input")?.restart()
		} else {
			setPhase("processing")
			setRunning(true)
		}
	}

	const toggle = () => {
		if (!ready) return
		if (running) {
			if (phase === "input") controller.getTrack("input")?.pause()
			else if (phase === "response") controller.getTrack("tts")?.pause()
			setRunning(false)
			return
		}
		if (phase === "idle" || phase === "done") {
			start()
			return
		}
		if (phase === "input") {
			controller.getTrack("input")?.play()
			setRunning(true)
		} else if (phase === "response") {
			controller.getTrack("tts")?.play()
			setRunning(true)
		} else if (phase === "processing") {
			setRunning(true)
		}
	}

	const inputSec = hasInput ? inputDur : 0
	const waitSec = waitMs / 1000
	const responseSec = hasTts ? ttsDur : 0
	const totalSec = Math.max(inputSec + waitSec + responseSec, 0.001)
	const showSegments = data.steps.length > 0

	const cells: ReplayCell[] = []
	if (inputSec > 0) {
		cells.push({
			className: "bg-chart-5",
			pct: (inputSec / totalSec) * 100,
			active: phase === "input",
		})
	}
	if (showSegments) {
		let cum = 0
		for (const step of data.steps) {
			const dur = step.ms * procScale
			const active =
				phase === "processing" && procElapsed >= cum && procElapsed < cum + dur
			cells.push({
				className: STEP_BG[step.key],
				pct: (dur / 1000 / totalSec) * 100,
				active,
			})
			cum += dur
		}
	} else {
		cells.push({
			className: "bg-chart-4",
			pct: (waitSec / totalSec) * 100,
			active: phase === "processing",
		})
	}
	if (responseSec > 0) {
		cells.push({
			className: "bg-primary",
			pct: (responseSec / totalSec) * 100,
			active: phase === "response",
		})
	}

	const playheadSec =
		phase === "input"
			? inputCur
			: phase === "processing"
				? inputSec + procElapsed / 1000
				: phase === "response"
					? inputSec + waitSec + ttsCur
					: phase === "done"
						? totalSec
						: 0
	const playheadPct = Math.min(100, (playheadSec / totalSec) * 100)

	const ttfaPct =
		data.ttfaMs != null
			? Math.min(100, ((inputSec + data.ttfaMs / 1000) / totalSec) * 100)
			: null

	const counterBase =
		phase === "input"
			? `${clock(inputCur)} / ${clock(inputDur)}`
			: phase === "processing"
				? `${clock(procElapsed / 1000)} / ${clock(waitSec)}`
				: phase === "response"
					? `${clock(ttsCur)} / ${clock(ttsDur)}`
					: phase === "done"
						? `${clock(totalSec)} / ${clock(totalSec)}`
						: `${clock(0)} / ${clock(totalSec)}`
	const phaseLabel = PHASE_LABEL[phase]
	const counter =
		running && phaseLabel ? `${phaseLabel} · ${counterBase}` : counterBase

	const buttonLabel = running
		? "Pause"
		: phase === "input" || phase === "processing" || phase === "response"
			? "Resume"
			: "Replay"

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
				<CardTitle className="flex items-center gap-2 text-base">
					<Zap className="size-4" />
					Replay
				</CardTitle>
				<Badge variant="secondary" className="font-mono tabular-nums">
					{formatMs(data.totalMs)}
				</Badge>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<div className="relative h-9">
						<div className="bg-muted absolute inset-0 flex overflow-hidden rounded-md">
							{cells.map((cell, i) => (
								<div
									key={i}
									className={cn(
										"h-full transition-opacity",
										cell.className,
										running && !cell.active && "opacity-45",
									)}
									style={{ width: `${cell.pct}%` }}
								/>
							))}
						</div>
						{ttfaPct != null && (
							<div
								className="bg-foreground/70 absolute top-0 bottom-0 w-px"
								style={{ left: `${ttfaPct}%` }}
								title={`First audio · ${formatMs(data.ttfaMs)}`}
							/>
						)}
						{running && (
							<div
								className="bg-foreground absolute top-0 bottom-0 w-0.5"
								style={{ left: `${playheadPct}%` }}
							/>
						)}
					</div>
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={toggle}
							disabled={!ready}
							className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors disabled:opacity-50"
						>
							{running ? (
								<Pause className="size-3.5" />
							) : (
								<Play className="size-3.5" />
							)}
							{buttonLabel}
						</button>
						<span className="text-muted-foreground font-mono text-xs tabular-nums">
							{counter}
						</span>
					</div>
				</div>

				{data.delegated ? (
					<p className="text-muted-foreground text-xs">
						Measured end-to-end. STT, LLM and TTS ran on a remote Domia
						(delegated), so a per-stage split isn&rsquo;t available here.
					</p>
				) : (
					<div className="space-y-2">
						{data.steps.map((step) => (
							<div key={step.key} className="flex items-center gap-3 text-sm">
								<span
									className={cn(
										"size-2.5 shrink-0 rounded-full",
										STEP_BG[step.key],
									)}
								/>
								<span className="flex-1">{step.label}</span>
								<span className="text-muted-foreground font-mono tabular-nums">
									{formatMs(step.ms)}
								</span>
								<span className="text-muted-foreground w-10 text-right text-xs tabular-nums">
									{Math.round(step.pct)}%
								</span>
							</div>
						))}
					</div>
				)}

				{data.ttfaMs != null && (
					<div className="flex items-center justify-between border-t pt-3 text-sm">
						<span className="flex items-center gap-2">
							<span className="bg-foreground/70 h-3 w-px" />
							Time to first audio
						</span>
						<span className="text-muted-foreground font-mono tabular-nums">
							{formatMs(data.ttfaMs)}
						</span>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
