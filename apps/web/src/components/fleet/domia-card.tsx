import { Link } from "@tanstack/react-router"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { StatusPill } from "@/components/domia/status"
import { RoleBadge } from "./columns"
import { formatMs, relativeTime } from "@/utils/format"
import { isOnline } from "@/utils/presence"
import { parseConfigSnapshot } from "@/utils/config"
import type { FleetRow } from "@/types/fleet"

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="space-y-0.5">
			<p className="font-mono text-sm font-medium tabular-nums">{value}</p>
			<p className="text-muted-foreground text-[10px] tracking-wide uppercase">
				{label}
			</p>
		</div>
	)
}

export function DomiaCard({ row }: { row: FleetRow }) {
	const persona = parseConfigSnapshot(row.configSnapshotJson).characterProfile

	return (
		<Link
			to="/domias/$key"
			params={{ key: row.domiaKey }}
			className="block focus-visible:outline-none"
		>
			<Card className="hover:border-foreground/20 h-full transition-colors">
				<CardHeader className="flex-row items-center gap-3 space-y-0">
					<PersonaAvatar domiaKey={row.domiaKey} name={row.name} size="md" />
					<div className="min-w-0 flex-1 space-y-1">
						<div className="flex items-center gap-2">
							<span className="truncate font-medium">{row.name}</span>
							<StatusPill online={isOnline(row.lastSeenAt)} />
						</div>
						<RoleBadge role={row.telemetry?.role} />
					</div>
				</CardHeader>
				<CardContent className="space-y-3">
					{persona && (
						<div className="flex flex-wrap gap-1.5">
							<Badge variant="secondary">{persona.name}</Badge>
							<Badge variant="outline">{persona.personality}</Badge>
							<Badge variant="outline">{persona.profession}</Badge>
						</div>
					)}
					<div className="grid grid-cols-3 gap-2 border-t pt-3">
						<Stat label="Volume" value={String(row.telemetry?.count ?? 0)} />
						<Stat
							label="TTFA p50"
							value={formatMs(row.telemetry?.ttfaP50 ?? null)}
						/>
						<Stat
							label="Last seen"
							value={relativeTime(row.lastInteractionAt)}
						/>
					</div>
					<div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
						<Badge variant="secondary" className="font-mono text-xs">
							{row.domiaKey}
						</Badge>
						<span className="font-mono">
							{row.localIp ? `${row.localIp}:${row.httpPort}` : "—"}
						</span>
					</div>
				</CardContent>
			</Card>
		</Link>
	)
}
