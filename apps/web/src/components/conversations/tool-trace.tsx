import { ChevronDown } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { formatMaybeJson, formatMs } from "@/utils/format"
import type {
	ToolResultErrorCode,
	ToolRunStatus,
	ToolTraceEntry,
} from "@/types/conversations"

const KNOWN_KINDS = new Set([
	"result",
	"dispatched",
	"async_outcome",
	"summary",
])

const isKnownEntry = (e: unknown): e is ToolTraceEntry =>
	!!e &&
	typeof e === "object" &&
	KNOWN_KINDS.has((e as { kind?: unknown }).kind as string)

const STATUS_STYLE: Record<
	ToolRunStatus,
	{ variant: "secondary" | "destructive" | "outline"; className: string }
> = {
	ok: { variant: "secondary", className: "text-success" },
	failed: { variant: "destructive", className: "" },
	timeout: {
		variant: "outline",
		className: "border-amber-400/60 text-amber-600 dark:text-amber-400",
	},
	cancelled: { variant: "outline", className: "text-muted-foreground" },
}

const STATUS_LABEL: Record<ToolRunStatus, () => string> = {
	ok: m.conv_tool_status_ok,
	failed: m.conv_tool_status_failed,
	timeout: m.conv_tool_status_timeout,
	cancelled: m.conv_tool_status_cancelled,
}

const ERROR_LABEL: Record<ToolResultErrorCode, () => string> = {
	error: m.conv_tool_error_error,
	blocked: m.conv_tool_error_blocked,
	unauthorized: m.conv_tool_error_unauthorized,
	timeout: m.conv_tool_error_timeout,
}

export const parseToolEntries = (value: unknown): ToolTraceEntry[] =>
	(Array.isArray(value) ? value : []).filter(isKnownEntry)

export const skillTraceTotalMs = (value: unknown): number | undefined => {
	const entries = parseToolEntries(value)
	const summary = entries.find((e) => e.kind === "summary")
	if (summary) return summary.toolMs
	const legacy = Array.isArray(value)
		? (value as { durationMs?: number; ms?: number }[]).reduce(
				(sum, t) => sum + (t?.durationMs ?? t?.ms ?? 0),
				0,
			)
		: 0
	return legacy || undefined
}

function StatusChip({ status }: { status: ToolRunStatus }) {
	const style = STATUS_STYLE[status]
	return (
		<Badge
			variant={style.variant}
			className={cn("text-[10px]", style.className)}
		>
			{STATUS_LABEL[status]()}
		</Badge>
	)
}

function ArgsInspector({
	args,
	resolvedArgs,
}: {
	args?: Record<string, unknown>
	resolvedArgs?: Record<string, unknown>
}) {
	const value = resolvedArgs ?? args
	const text = value ? formatMaybeJson(value) : null
	if (!text) return null
	const label = resolvedArgs ? m.conv_tool_resolved_args() : m.conv_tool_args()
	return (
		<Collapsible>
			<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-[11px] outline-none">
				<ChevronDown className="size-3 transition-transform group-data-[panel-open]:rotate-180" />
				{label}
			</CollapsibleTrigger>
			<CollapsibleContent className="pt-1.5">
				<pre className="bg-background/60 overflow-x-auto rounded-md px-3 py-2 font-mono text-xs">
					{text}
				</pre>
			</CollapsibleContent>
		</Collapsible>
	)
}

function ToolEntryCard({ entry }: { entry: ToolTraceEntry }) {
	if (entry.kind === "summary") return null

	return (
		<div className="bg-background/60 space-y-2 rounded-md border px-3 py-2.5">
			<div className="flex flex-wrap items-center gap-1.5">
				<Badge variant="secondary" className="font-mono text-[10px]">
					{entry.tool}
				</Badge>
				{entry.kind === "dispatched" ? (
					<Badge
						variant="outline"
						className="text-muted-foreground text-[10px]"
					>
						{m.conv_tool_dispatched()}
					</Badge>
				) : (
					<StatusChip status={entry.status} />
				)}
				{entry.kind === "result" && entry.errorCode && (
					<Badge
						variant="outline"
						className="border-destructive/40 text-destructive text-[10px]"
					>
						{ERROR_LABEL[entry.errorCode]()}
					</Badge>
				)}
				{entry.kind === "async_outcome" && (
					<Badge
						variant="outline"
						className="text-muted-foreground text-[10px]"
					>
						{m.conv_tool_async()}
					</Badge>
				)}
				{entry.kind === "result" && (
					<span className="text-muted-foreground ml-auto font-mono text-[11px] tabular-nums">
						{formatMs(entry.durationMs)}
					</span>
				)}
			</div>

			{entry.kind === "result" && (
				<p className="text-sm">{entry.displaySummary ?? entry.summaryForLlm}</p>
			)}
			{entry.kind === "async_outcome" && (
				<p className="text-sm">{entry.summaryForLlm}</p>
			)}

			<ArgsInspector
				args={
					entry.kind === "result" || entry.kind === "dispatched"
						? entry.args
						: undefined
				}
				resolvedArgs={
					entry.kind === "result" || entry.kind === "async_outcome"
						? entry.resolvedArgs
						: undefined
				}
			/>
		</div>
	)
}

function SummaryFooter({
	entry,
}: {
	entry: Extract<ToolTraceEntry, { kind: "summary" }>
}) {
	return (
		<div className="text-muted-foreground flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px]">
			<span>
				{m.conv_tool_summary_decision()} {formatMs(entry.decisionMs)}
			</span>
			<span>
				{m.conv_tool_summary_tools()} {formatMs(entry.toolMs)}
			</span>
			<span>
				{m.conv_tool_summary_finalize()} {formatMs(entry.finalizeMs)}
			</span>
			<span>
				{m.conv_tool_summary_mode()} {entry.finalizeMode}
			</span>
			<span>
				{m.conv_tool_summary_stop()} {entry.stopReason}
			</span>
		</div>
	)
}

export function ToolTrace({ skillResponse }: { skillResponse: unknown }) {
	const known = parseToolEntries(skillResponse)
	if (known.length === 0) {
		const text = formatMaybeJson(skillResponse)
		return text ? (
			<pre className="bg-background/60 overflow-x-auto rounded-md px-3 py-2 font-mono text-xs">
				{text}
			</pre>
		) : null
	}

	const summary = known.find((e) => e.kind === "summary")
	const tools = known.filter((e) => e.kind !== "summary")

	return (
		<div className="space-y-2">
			{tools.map((entry, i) => (
				<ToolEntryCard key={i} entry={entry} />
			))}
			{summary?.kind === "summary" && <SummaryFooter entry={summary} />}
		</div>
	)
}
