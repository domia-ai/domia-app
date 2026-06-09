import type { ColumnDef } from "@tanstack/react-table"
import {
	Cpu,
	Mic,
	ThumbsDown,
	ThumbsUp,
	Type,
	Volume2,
	Wrench,
} from "lucide-react"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatMs, relativeTime } from "@/utils/format"
import { buildLatency } from "@/utils/latency"
import { buildJourney } from "@/utils/journey"
import { deriveFlow } from "@/utils/flow"
import { FLOWS } from "@/constants/conversations"
import { InlineAudio } from "./inline-audio"
import type { ConversationRow, LatencyStepKey } from "@/types/conversations"

const STEP_BG: Record<LatencyStepKey, string> = {
	stt: "bg-chart-1",
	llm: "bg-chart-2",
	tts: "bg-chart-3",
}

export const conversationColumns: ColumnDef<ConversationRow>[] = [
	{
		id: "domia",
		header: "Domia",
		enableHiding: false,
		enableSorting: false,
		cell: ({ row }) => {
			const name = row.original.domiaName ?? row.original.sourceDomiaKey
			return (
				<div className="flex items-center gap-2.5">
					<PersonaAvatar
						domiaKey={row.original.sourceDomiaKey}
						name={name}
						size="sm"
					/>
					<span className="font-medium">{name}</span>
				</div>
			)
		},
	},
	{
		id: "flow",
		header: "Flow",
		enableSorting: false,
		cell: ({ row }) => {
			const key = deriveFlow(row.original.inputType, row.original.responseType)
			const flow = FLOWS.find((f) => f.key === key)
			return (
				<Badge variant="outline" className="gap-1.5 font-medium">
					<span className={cn("size-2 rounded-full", flow?.className)} />
					{key.toUpperCase()}
				</Badge>
			)
		},
	},
	{
		id: "input",
		header: "Input",
		enableSorting: false,
		cell: ({ row }) => {
			const Icon = row.original.inputType === "VOICE" ? Mic : Type
			return (
				<div className="flex items-center gap-2">
					{row.original.inputAudioPath ? (
						<InlineAudio interactionId={row.original.id} kind="input" />
					) : (
						<Icon className="text-muted-foreground size-3.5 shrink-0" />
					)}
					<span className="line-clamp-1 max-w-xs">
						{row.original.sttResult ?? row.original.inputRaw ?? "—"}
					</span>
				</div>
			)
		},
	},
	{
		id: "response",
		header: "Response",
		enableSorting: false,
		cell: ({ row }) => (
			<div className="text-muted-foreground flex items-center gap-2">
				{row.original.ttsAudioPath && (
					<InlineAudio interactionId={row.original.id} kind="tts" />
				)}
				{row.original.responseType === "voice" &&
					!row.original.ttsAudioPath && (
						<Volume2 className="size-3.5 shrink-0" />
					)}
				<span className="line-clamp-1 max-w-sm">
					{row.original.llmResponse ?? "—"}
				</span>
			</div>
		),
	},
	{
		id: "latency",
		accessorKey: "totalMs",
		header: "Latency",
		cell: ({ row }) => {
			const lat = buildLatency(row.original)
			if (!lat) return <span className="text-muted-foreground">—</span>
			return (
				<div className="space-y-1">
					<span className="font-mono text-xs tabular-nums">
						{formatMs(lat.totalMs)}
					</span>
					{!lat.delegated && (
						<div className="bg-muted flex h-1 w-20 overflow-hidden rounded-full">
							{lat.steps.map((s) => (
								<div
									key={s.key}
									className={STEP_BG[s.key]}
									style={{ width: `${s.pct}%` }}
								/>
							))}
						</div>
					)}
				</div>
			)
		},
	},
	{
		id: "rating",
		header: "Rating",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.rating === "up" ? (
				<ThumbsUp className="text-success size-4" />
			) : row.original.rating === "down" ? (
				<ThumbsDown className="text-destructive size-4" />
			) : (
				<span className="text-muted-foreground">—</span>
			),
	},
	{
		id: "executor",
		header: "Executor",
		enableSorting: false,
		cell: ({ row }) => {
			const remote = buildJourney(
				row.original,
				row.original.sourceDomiaKey,
			).filter((s) => !s.local)
			if (remote.length === 0)
				return <span className="text-muted-foreground text-xs">local</span>
			const names = [...new Set(remote.map((s) => s.executorName))]
			return (
				<div className="flex flex-wrap gap-1">
					{names.map((name) => (
						<Badge key={name} className="gap-1 px-1.5 py-0 text-[10px]">
							<Cpu className="size-3" />
							{name}
						</Badge>
					))}
				</div>
			)
		},
	},
	{
		id: "tags",
		header: "Tags",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.tags?.length ? (
				<div className="flex flex-wrap gap-1">
					{row.original.tags.map((tag) => (
						<Badge key={tag} variant="secondary" className="text-[10px]">
							{tag}
						</Badge>
					))}
				</div>
			) : (
				<span className="text-muted-foreground">—</span>
			),
	},
	{
		id: "ttsEngine",
		header: "TTS engine",
		enableSorting: false,
		cell: ({ row }) => (
			<span className="text-muted-foreground font-mono text-xs">
				{row.original.ttsEngineUsed ?? "—"}
			</span>
		),
	},
	{
		id: "tool",
		header: "Tool",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.mcpServerUsed ? (
				<Badge variant="secondary" className="gap-1 text-[10px]">
					<Wrench className="size-3" />
					{row.original.mcpServerUsed}
				</Badge>
			) : (
				<span className="text-muted-foreground">—</span>
			),
	},
	{
		id: "session",
		header: "Session",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.interactionSessionTraceId ? (
				<span className="text-muted-foreground font-mono text-xs">
					{row.original.interactionSessionTraceId.slice(0, 8)}
				</span>
			) : (
				<span className="text-muted-foreground">—</span>
			),
	},
	{
		accessorKey: "createdAt",
		id: "createdAt",
		header: "When",
		cell: ({ row }) => (
			<span className="text-muted-foreground whitespace-nowrap">
				{relativeTime(row.original.createdAt)}
			</span>
		),
	},
]
