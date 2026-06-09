import { useQuery } from "@tanstack/react-query"
import { Activity, MessagesSquare, Radio, Zap } from "lucide-react"
import { StatCard } from "@/components/domia/stat-card"
import { formatMs } from "@/utils/format"
import { fleetStatsQueryOptions } from "@/server/fleet"
import { LIVE_REFRESH_MS } from "@/constants/conversations"

export function FleetStatsHeader() {
	const { data } = useQuery({
		...fleetStatsQueryOptions(),
		refetchInterval: LIVE_REFRESH_MS,
	})

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
