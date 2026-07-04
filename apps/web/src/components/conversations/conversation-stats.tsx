import { useQuery } from "@tanstack/react-query"
import { useTableParams } from "@/hooks/use-table-params"
import { tableParamsToQuery } from "@/utils/table-params"
import { getConversationStatsFn } from "@/server/conversations"
import { formatMs } from "@/utils/format"
import { cn } from "@/lib/utils"
import { CONVERSATION_FILTER_KEYS, FLOWS } from "@/constants/conversations"

export function ConversationStatsHeader() {
	const tp = useTableParams(CONVERSATION_FILTER_KEYS)
	const params = {
		page: tp.page,
		pageSize: tp.pageSize,
		search: tp.search,
		sort: tp.sort,
		filters: tp.filters,
	}
	const query = tableParamsToQuery(params)

	const { data, isLoading, isError, refetch } = useQuery({
		queryKey: ["conversation-stats", query],
		queryFn: () => getConversationStatsFn({ data: params }),
	})

	if (isLoading) {
		return (
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
				{Array.from({ length: 5 }).map((_, i) => (
					<div
						key={i}
						className="bg-muted/40 h-[68px] animate-pulse rounded-lg"
					/>
				))}
			</div>
		)
	}

	if (isError || !data) {
		return (
			<div className="text-muted-foreground flex items-center gap-3 rounded-lg border border-dashed p-3 text-sm">
				<span>Couldn’t load conversation stats.</span>
				<button
					type="button"
					onClick={() => refetch()}
					className="text-foreground font-medium hover:underline"
				>
					Retry
				</button>
			</div>
		)
	}

	const cards = [
		{ label: "Total", value: String(data.total) },
		{ label: "Avg latency", value: formatMs(data.avgMs) },
		{
			label: "Felt TTFA p50 · p95",
			value:
				data.perceived.p50 === null
					? "—"
					: `${formatMs(data.perceived.p50)} · ${formatMs(data.perceived.p95)}`,
		},
		{ label: "Error rate", value: `${Math.round(data.errorRate * 100)}%` },
		{ label: "Ungraded", value: String(data.ungraded) },
	]

	return (
		<div className="space-y-3">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
				{cards.map((c) => (
					<div key={c.label} className="rounded-lg border p-3">
						<p className="text-muted-foreground text-xs">{c.label}</p>
						<p className="text-xl font-semibold tabular-nums">{c.value}</p>
					</div>
				))}
			</div>
			{data.flows.length > 0 && (
				<div className="flex flex-wrap gap-2">
					{data.flows.map((f) => {
						const flow = FLOWS.find((x) => x.key === f.key)
						return (
							<span
								key={f.key}
								className="text-muted-foreground inline-flex items-center gap-1.5 text-xs"
							>
								<span className={cn("size-2 rounded-full", flow?.className)} />
								{f.key.toUpperCase()} {f.count}
							</span>
						)
					})}
				</div>
			)}
		</div>
	)
}
