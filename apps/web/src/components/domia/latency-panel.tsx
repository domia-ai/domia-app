import { m } from "@/paraglide/messages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { LatencyStatsBody } from "@/components/analytics/latency-stats"
import { useActionQuery } from "@/hooks/use-query-state"
import { latencyStatsQueryOptions } from "@/server/latency"
import type { LatencyPanelProps } from "@/types/latency"

export function LatencyPanel({ domiaKey, online }: LatencyPanelProps) {
	const { state } = useActionQuery({
		...latencyStatsQueryOptions(domiaKey),
		enabled: online,
		errorMessage: m.lat_load_error,
	})

	return (
		<Card>
			<CardHeader className="gap-1">
				<CardTitle className="text-base">{m.lat_panel_title()}</CardTitle>
				<p className="text-muted-foreground text-sm">
					{m.lat_panel_description()}
				</p>
			</CardHeader>
			<CardContent>
				{online ? (
					<AsyncBoundary
						state={state}
						skeleton={
							<div className="space-y-3">
								<Skeleton className="h-40 w-full" />
								<Skeleton className="h-20 w-full" />
							</div>
						}
					>
						{(view) =>
							view ? (
								<LatencyStatsBody view={view} />
							) : (
								<p className="text-muted-foreground text-sm">
									{m.lat_load_error()}
								</p>
							)
						}
					</AsyncBoundary>
				) : (
					<p className="text-muted-foreground text-sm">{m.lat_offline()}</p>
				)}
			</CardContent>
		</Card>
	)
}
