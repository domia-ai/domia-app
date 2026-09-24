import {
	AudioLines,
	Brain,
	Compass,
	Ear,
	Loader2,
	Radio,
	Sparkles,
	Volume2,
	Wrench,
	type LucideIcon,
} from "lucide-react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
import { cn } from "@/lib/utils"
import { formatMs } from "@/utils/format"
import type { StreamStripProps } from "@/types/chat"

const STAGE_META: Record<
	string,
	{ icon: LucideIcon; tone: string; label: () => string }
> = {
	stt: {
		icon: Ear,
		tone: "bg-chart-1/15 text-chart-1",
		label: m.stream_stage_stt,
	},
	context: {
		icon: Compass,
		tone: "bg-chart-4/15 text-chart-4",
		label: m.stream_stage_context,
	},
	skills: {
		icon: Sparkles,
		tone: "bg-chart-4/15 text-chart-4",
		label: m.stream_stage_skills,
	},
	llm: {
		icon: Brain,
		tone: "bg-chart-2/15 text-chart-2",
		label: m.stream_stage_llm,
	},
	tool: {
		icon: Wrench,
		tone: "bg-chart-3/15 text-chart-3",
		label: m.stream_stage_tool,
	},
	tts: {
		icon: AudioLines,
		tone: "bg-chart-5/15 text-chart-5",
		label: m.stream_stage_tts,
	},
	playback: {
		icon: Volume2,
		tone: "bg-primary/15 text-primary",
		label: m.stream_stage_playback,
	},
	satellite: {
		icon: Radio,
		tone: "bg-muted text-muted-foreground",
		label: m.stream_stage_satellite,
	},
}

const FALLBACK_TONE = "bg-muted text-muted-foreground"

export function StreamStrip({ state }: StreamStripProps) {
	const empty = state.steps.length === 0 && state.tools.length === 0

	if (empty) {
		return (
			<Marker role="status">
				<MarkerIcon>
					<Loader2 className="size-3.5 animate-spin" />
				</MarkerIcon>
				<MarkerContent>{m.stream_waiting()}</MarkerContent>
			</Marker>
		)
	}

	return (
		<div className="flex flex-wrap items-center gap-1.5" role="status">
			{state.steps.map((step) => {
				const meta = STAGE_META[step.name]
				const Icon = meta?.icon ?? Radio
				return (
					<span
						key={step.id}
						className={cn(
							"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px]",
							meta?.tone ?? FALLBACK_TONE,
							step.status === "failed" && "bg-destructive/15 text-destructive",
							step.status === null && "animate-pulse",
						)}
					>
						<Icon className="size-3" />
						{meta?.label() ?? step.name}
						{step.status === "ok" && step.elapsedMs !== null && (
							<span className="font-mono tabular-nums opacity-70">
								{formatMs(step.elapsedMs)}
							</span>
						)}
						{step.status === "failed" && <span>{m.stream_step_failed()}</span>}
					</span>
				)
			})}
			{state.tools.map((tool) => (
				<Badge
					key={tool.id}
					variant={
						tool.status === null || tool.status === "ok"
							? "secondary"
							: "destructive"
					}
					className={cn(
						"gap-1.5 text-[10px]",
						tool.status === null && "animate-pulse",
					)}
				>
					<Wrench className="size-3" />
					<span className="font-mono">{tool.name}</span>
					{tool.status && tool.status !== "ok" && <span>{tool.status}</span>}
					{tool.toolMs !== null && (
						<span className="font-mono tabular-nums opacity-70">
							{formatMs(tool.toolMs)}
						</span>
					)}
				</Badge>
			))}
		</div>
	)
}
