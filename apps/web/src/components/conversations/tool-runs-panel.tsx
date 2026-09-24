import { ListOrdered, ShieldCheck, Wrench } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { useActionQuery } from "@/hooks/use-query-state"
import { toolRunsQueryOptions } from "@/server/tool-runs"
import { formatMs, relativeTime } from "@/utils/format"
import { CopyButton } from "./copy-button"
import { StatusChip } from "./tool-status"
import type {
	ToolRunGroupProps,
	ToolRunListProps,
	ToolRunRowProps,
	ToolRunsPanelProps,
} from "@/types/tool-runs"

const ARGS_HASH_PREVIEW = 8

function RunRow({ run }: ToolRunRowProps) {
	return (
		<div className="bg-background/60 space-y-2 rounded-md border px-3 py-2.5">
			<div className="flex flex-wrap items-center gap-1.5">
				{run.stepIndex != null && (
					<Badge
						variant="outline"
						className="text-muted-foreground text-[10px]"
					>
						{m.conv_tool_run_step({ index: run.stepIndex + 1 })}
					</Badge>
				)}
				<Badge variant="secondary" className="font-mono text-[10px]">
					{run.tool}
				</Badge>
				<StatusChip status={run.status ?? "dispatched"} />
				{run.riskClass && (
					<Badge variant="outline" className="text-[10px]">
						{m.conv_tool_run_risk({ value: run.riskClass })}
					</Badge>
				)}
				{run.policyDecision && (
					<Badge
						variant="outline"
						className="text-muted-foreground gap-1 text-[10px]"
					>
						<ShieldCheck className="size-3" />
						{run.policySource
							? m.conv_tool_run_policy_source({
									decision: run.policyDecision,
									source: run.policySource,
								})
							: m.conv_tool_run_policy({ decision: run.policyDecision })}
					</Badge>
				)}
				{run.confirmationId && (
					<Badge variant="outline" className="text-[10px]">
						{m.conv_tool_run_confirmed()}
					</Badge>
				)}
				<span className="text-muted-foreground ml-auto font-mono text-[11px] tabular-nums">
					{formatMs(run.durationMs)}
				</span>
			</div>
			<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
				{run.providerSlug && (
					<span className="font-mono">{run.providerSlug}</span>
				)}
				{run.argsHash && (
					<CopyButton
						text={run.argsHash}
						label={m.conv_tool_run_args_hash({
							hash: run.argsHash.slice(0, ARGS_HASH_PREVIEW),
						})}
					/>
				)}
				<span>{relativeTime(run.createdAt)}</span>
			</div>
		</div>
	)
}

function RunGroup({ group }: ToolRunGroupProps) {
	if (!group.routineSlug) return <RunRow run={group.runs[0]} />
	return (
		<div className="space-y-2 rounded-md border border-dashed px-3 py-2.5">
			<div className="flex flex-wrap items-center gap-2">
				<Badge variant="secondary" className="gap-1 font-mono text-[10px]">
					<ListOrdered className="size-3" />
					{group.routineSlug}
				</Badge>
				<span className="text-muted-foreground text-[11px]">
					{m.conv_tool_run_steps({ count: group.runs.length })}
				</span>
				<span className="text-muted-foreground ml-auto font-mono text-[11px] tabular-nums">
					{formatMs(group.totalMs)}
				</span>
			</div>
			<div className="space-y-2">
				{group.runs.map((run) => (
					<RunRow key={run.id} run={run} />
				))}
			</div>
		</div>
	)
}

function RunList({ groups, source }: ToolRunListProps) {
	if (groups.length === 0)
		return (
			<p className="text-muted-foreground text-sm">
				{m.conv_tool_runs_empty()}
			</p>
		)
	return (
		<div className="space-y-2">
			<Badge variant="outline" className="text-muted-foreground text-[10px]">
				{source === "live"
					? m.conv_tool_runs_source_live()
					: m.conv_tool_runs_source_archived()}
			</Badge>
			{groups.map((group) => (
				<RunGroup key={group.key} group={group} />
			))}
		</div>
	)
}

export function ToolRunsPanel({
	interactionId,
	domiaKey,
	mirrored,
}: ToolRunsPanelProps) {
	const needsLive = mirrored.length === 0
	const { state } = useActionQuery({
		...toolRunsQueryOptions(domiaKey, interactionId),
		enabled: needsLive,
		errorMessage: m.conv_tool_runs_error,
	})

	return (
		<Card>
			<CardHeader className="gap-1">
				<CardTitle className="flex items-center gap-2 text-base">
					<Wrench className="size-4" />
					{m.conv_tool_runs_title()}
				</CardTitle>
				<p className="text-muted-foreground text-sm">
					{m.conv_tool_runs_description()}
				</p>
			</CardHeader>
			<CardContent>
				{needsLive ? (
					<AsyncBoundary
						state={state}
						skeleton={<Skeleton className="h-20 w-full" />}
					>
						{(groups) => <RunList groups={groups ?? []} source="live" />}
					</AsyncBoundary>
				) : (
					<RunList groups={mirrored} source="archived" />
				)}
			</CardContent>
		</Card>
	)
}
