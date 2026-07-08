import { useQuery } from "@tanstack/react-query"
import { Activity, MessagesSquare, Radio, Zap } from "lucide-react"
import { m } from "@/paraglide/messages"
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
				{m.fleet_stats_load_failed()}
			</div>
		)

	return (
		<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
			<StatCard
				label={m.fleet_stat_online_now()}
				value={data ? data.online : "—"}
				icon={Radio}
				accent="success"
				hint={data ? m.fleet_hint_discovered({ count: data.total }) : undefined}
			/>
			<StatCard
				label={m.fleet_stat_first_audio()}
				value={data ? formatMs(data.ttfaP50) : "—"}
				icon={Zap}
				hint={m.fleet_hint_p50_mesh()}
			/>
			<StatCard
				label={m.fleet_stat_interactions()}
				value={data ? data.volume24h : "—"}
				icon={MessagesSquare}
				hint={m.fleet_hint_last_24h()}
			/>
			<StatCard
				label={m.fleet_stat_active_sessions()}
				value={data ? data.activeSessions : "—"}
				icon={Activity}
				accent="warning"
				hint={m.fleet_hint_last_30m()}
			/>
		</div>
	)
}
