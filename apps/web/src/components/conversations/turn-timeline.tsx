import {
	AudioLines,
	Ban,
	Brain,
	ChevronDown,
	CircleCheck,
	CircleX,
	Compass,
	Cpu,
	Ear,
	GitBranch,
	MessageSquare,
	Play,
	Radio,
	Volume2,
	Wrench,
	type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { formatMaybeJson, formatMs } from "@/utils/format"
import { humanizeDomiaKey } from "@/utils/journey"
import type { ToolRunStatus, TurnEventRow } from "@/types/conversations"

type EventGroup =
	| "start"
	| "stt"
	| "intent"
	| "llm"
	| "tool"
	| "tts"
	| "playback"
	| "terminal"
	| "error"
	| "speculation"

const EVENT_META: Record<
	string,
	{ icon: LucideIcon; group: EventGroup; label: () => string }
> = {
	"turn.started": {
		icon: Play,
		group: "start",
		label: m.conv_event_turn_started,
	},
	"stt.final": { icon: Ear, group: "stt", label: m.conv_event_stt_final },
	"intent.decided": {
		icon: Compass,
		group: "intent",
		label: m.conv_event_intent_decided,
	},
	"llm.first_sentence": {
		icon: MessageSquare,
		group: "llm",
		label: m.conv_event_llm_first_sentence,
	},
	"llm.done": { icon: Brain, group: "llm", label: m.conv_event_llm_done },
	"tool.requested": {
		icon: Wrench,
		group: "tool",
		label: m.conv_event_tool_requested,
	},
	"tool.result": {
		icon: Wrench,
		group: "tool",
		label: m.conv_event_tool_result,
	},
	"tts.first_audio": {
		icon: AudioLines,
		group: "tts",
		label: m.conv_event_tts_first_audio,
	},
	"playback.started": {
		icon: Volume2,
		group: "playback",
		label: m.conv_event_playback_started,
	},
	"playback.finished": {
		icon: Volume2,
		group: "playback",
		label: m.conv_event_playback_finished,
	},
	"turn.completed": {
		icon: CircleCheck,
		group: "terminal",
		label: m.conv_event_turn_completed,
	},
	"turn.failed": {
		icon: CircleX,
		group: "error",
		label: m.conv_event_turn_failed,
	},
	"turn.aborted": {
		icon: Ban,
		group: "error",
		label: m.conv_event_turn_aborted,
	},
	"speculation.started": {
		icon: GitBranch,
		group: "speculation",
		label: m.conv_event_speculation_started,
	},
	"speculation.committed": {
		icon: GitBranch,
		group: "speculation",
		label: m.conv_event_speculation_committed,
	},
	"speculation.discarded": {
		icon: GitBranch,
		group: "speculation",
		label: m.conv_event_speculation_discarded,
	},
}

const FALLBACK_META = { icon: Radio, group: "start" as EventGroup }

const GROUP_DOT: Record<EventGroup, string> = {
	start: "bg-muted text-muted-foreground",
	stt: "bg-chart-1/15 text-chart-1",
	intent: "bg-chart-4/15 text-chart-4",
	llm: "bg-chart-2/15 text-chart-2",
	tool: "bg-chart-3/15 text-chart-3",
	tts: "bg-chart-5/15 text-chart-5",
	playback: "bg-primary/15 text-primary",
	terminal: "bg-success/15 text-success",
	error: "bg-destructive/15 text-destructive",
	speculation: "bg-muted text-muted-foreground",
}

const STATUS_VARIANT: Record<
	ToolRunStatus,
	"secondary" | "destructive" | "outline"
> = {
	ok: "secondary",
	failed: "destructive",
	timeout: "destructive",
	cancelled: "outline",
}

const asObj = (p: unknown): Record<string, unknown> =>
	p && typeof p === "object" && !Array.isArray(p)
		? (p as Record<string, unknown>)
		: {}

const num = (v: unknown): number | null => (typeof v === "number" ? v : null)
const str = (v: unknown): string | null => (typeof v === "string" ? v : null)

function Chip({ children }: { children: ReactNode }) {
	return (
		<span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-[11px] tabular-nums">
			{children}
		</span>
	)
}

function InlineFields({ event }: { event: TurnEventRow }) {
	const p = asObj(event.payload)
	const chips: ReactNode[] = []
	let text: string | null = null

	const addMs = (tag: string, v: unknown) => {
		if (num(v) != null)
			chips.push(<Chip key={tag}>{`${tag} ${formatMs(num(v))}`}</Chip>)
	}

	switch (event.type) {
		case "stt.final":
			text = str(p.transcript)
			addMs("stt", p.sttMs)
			break
		case "intent.decided":
			if (str(p.decision))
				chips.push(<Chip key="decision">{str(p.decision)}</Chip>)
			break
		case "llm.done":
			addMs("llm", p.llmMs)
			if (num(p.tokens) != null)
				chips.push(<Chip key="tokens">{`${num(p.tokens)} tok`}</Chip>)
			if (str(p.finishReason))
				chips.push(<Chip key="finish">{str(p.finishReason)}</Chip>)
			break
		case "tool.requested":
			if (str(p.toolName)) chips.push(<Chip key="tool">{str(p.toolName)}</Chip>)
			break
		case "tool.result": {
			if (str(p.toolName)) chips.push(<Chip key="tool">{str(p.toolName)}</Chip>)
			const status = str(p.status) as ToolRunStatus | null
			if (status && status in STATUS_VARIANT)
				chips.push(
					<Badge
						key="status"
						variant={STATUS_VARIANT[status]}
						className="text-[10px]"
					>
						{status}
					</Badge>,
				)
			addMs("tool", p.toolMs)
			break
		}
		case "tts.first_audio":
			addMs("tts", p.ttsFirstChunkMs)
			break
		case "playback.started":
		case "playback.finished":
			if (str(p.status)) chips.push(<Chip key="status">{str(p.status)}</Chip>)
			if (typeof p.playedLocally === "boolean")
				chips.push(
					<Chip key="local">{p.playedLocally ? "local" : "remote"}</Chip>,
				)
			break
		case "turn.completed":
			addMs("ttfa", p.ttfaMs)
			addMs("perceived", p.perceivedTtfaMs)
			addMs("total", p.totalMs)
			break
		case "turn.failed":
			if (str(p.step)) chips.push(<Chip key="step">{str(p.step)}</Chip>)
			if (str(p.errorCode))
				chips.push(
					<Badge key="code" variant="destructive" className="text-[10px]">
						{str(p.errorCode)}
					</Badge>,
				)
			text = str(p.errorMessage)
			break
		case "turn.aborted":
			if (str(p.reason)) chips.push(<Chip key="reason">{str(p.reason)}</Chip>)
			break
		default:
			break
	}

	if (chips.length === 0 && !text) return null
	const isError = event.type === "turn.failed"
	return (
		<div className="space-y-1">
			{text && (
				<p className={cn("text-sm", isError && "text-destructive")}>{text}</p>
			)}
			{chips.length > 0 && (
				<div className="flex flex-wrap items-center gap-1.5">{chips}</div>
			)}
		</div>
	)
}

export function TurnTimeline({
	events,
	originKey,
}: {
	events: TurnEventRow[]
	originKey: string
}) {
	if (events.length === 0)
		return (
			<div className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
				{m.conv_timeline_empty()}
			</div>
		)

	const sorted = [...events].sort((a, b) => a.seq - b.seq)
	const t0 =
		sorted.find((e) => e.type === "turn.started")?.ts ?? sorted[0]?.ts ?? 0

	return (
		<ol className="space-y-0">
			{sorted.map((event, i) => {
				const meta = EVENT_META[event.type]
				const Icon = meta?.icon ?? FALLBACK_META.icon
				const group = meta?.group ?? FALLBACK_META.group
				const isLast = i === sorted.length - 1
				const delegated =
					event.executorDomiaKey && event.executorDomiaKey !== originKey
				const payloadText = formatMaybeJson(event.payload)
				return (
					<li key={event.id} className="relative flex gap-3 pb-4">
						{!isLast && (
							<span className="bg-border absolute top-6 left-[11px] h-full w-px" />
						)}
						<span
							className={cn(
								"z-10 flex size-6 shrink-0 items-center justify-center rounded-full",
								GROUP_DOT[group],
							)}
						>
							<Icon className="size-3.5" />
						</span>
						<div className="min-w-0 flex-1 space-y-1.5">
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-sm font-medium">
									{meta?.label() ?? event.type}
								</span>
								{delegated && (
									<Badge variant="outline" className="gap-1 text-[10px]">
										<Cpu className="size-3" />
										{humanizeDomiaKey(event.executorDomiaKey as string)}
									</Badge>
								)}
								{event.satelliteId && (
									<Badge variant="outline" className="text-[10px]">
										{m.conv_event_satellite()}: {event.satelliteId}
									</Badge>
								)}
								<span className="text-muted-foreground ml-auto font-mono text-[11px] tabular-nums">
									+{formatMs(event.ts - t0)}
								</span>
							</div>
							<InlineFields event={event} />
							{payloadText && (
								<Collapsible>
									<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-[11px] outline-none">
										<ChevronDown className="size-3 transition-transform group-data-[panel-open]:rotate-180" />
										{event.type}
									</CollapsibleTrigger>
									<CollapsibleContent className="pt-1.5">
										<pre className="bg-background/60 overflow-x-auto rounded-md px-3 py-2 font-mono text-xs">
											{payloadText}
										</pre>
									</CollapsibleContent>
								</Collapsible>
							)}
						</div>
					</li>
				)
			})}
		</ol>
	)
}
