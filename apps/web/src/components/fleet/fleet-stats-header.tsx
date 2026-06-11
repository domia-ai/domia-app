import { useQuery } from "@tanstack/react-query"
import { Activity, MessagesSquare, Radio, Zap } from "lucide-react"
import { StatCard } from "@/components/domia/stat-card"
import { Skeleton } from "@/components/ui/skeleton"
import { formatMs } from "@/utils/format"
import { fleetStatsQueryOptions } from "@/server/fleet"
import { useConsolePrefs } from "@/components/providers/console-prefs"

export function FleetStatsHeader() {
	const { liveRefreshMs } = useConsolePrefs()
	const { data, isLoading, isError } = useQuery({
		...fleetStatsQueryOptions(),
		refetchInterval: liveRefreshMs,
	})

	if (isLoading)
		return (
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				{[0, 1, 2, 3].map((i) => (
					<Skeleton key={i} className="h-[88px] w-full" />
				))}
			</div>
		)

	if (isError && !data)
		return (
			<div className="border-destructive/30 text-destructive rounded-lg border border-dashed px-4 py-6 text-center text-sm">
				Couldn't load fleet stats.
			</div>
		)

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<StatCard
				label="Online now"
				value={data ? data.online : "—"}
				icon={Radio}
				accent="success"
				hint={data ? `${data.total} discovered` : undefined}
			/>
			<StatCard
				label="Fleet first audio"
				value={data ? formatMs(data.ttfaP50) : "—"}
				icon={Zap}
				hint="p50 across the mesh"
			/>
			<StatCard
				label="Interactions"
				value={data ? data.volume24h : "—"}
				icon={MessagesSquare}
				hint="last 24h"
			/>
			<StatCard
				label="Active sessions"
				value={data ? data.activeSessions : "—"}
				icon={Activity}
				accent="warning"
				hint="last 30 min"
			/>
		</div>
	)
}
