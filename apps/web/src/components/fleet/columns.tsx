import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { formatMs, relativeTime } from "@/utils/format"
import { isOnline } from "@/utils/presence"
import { cn } from "@/lib/utils"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { StatusPill } from "@/components/domia/status"
import type { DomiaRole, FleetRow } from "@/types/fleet"

const ROLE_META: Record<DomiaRole, { label: string; dot: string }> = {
	hub: { label: "Hub", dot: "bg-chart-1" },
	thin: { label: "Thin client", dot: "bg-chart-3" },
	standalone: { label: "Standalone", dot: "bg-muted-foreground/40" },
}

export function RoleBadge({ role }: { role: DomiaRole | undefined }) {
	if (!role) return <span className="text-muted-foreground text-sm">—</span>
	const meta = ROLE_META[role]
	return (
		<span className="inline-flex items-center gap-1.5 text-sm">
			<span className={cn("size-2 rounded-full", meta.dot)} />
			{meta.label}
		</span>
	)
}

export const fleetColumns: ColumnDef<FleetRow>[] = [
	{
		accessorKey: "name",
		header: "Name",
		cell: ({ row }) => (
			<div className="flex items-center gap-3">
				<PersonaAvatar
					domiaKey={row.original.domiaKey}
					name={row.original.name}
					size="sm"
				/>
				<span className="font-medium">{row.original.name}</span>
			</div>
		),
	},
	{
		id: "role",
		header: "Role",
		enableSorting: false,
		cell: ({ row }) => <RoleBadge role={row.original.telemetry?.role} />,
	},
	{
		accessorKey: "lastSeenAt",
		header: "Status",
		cell: ({ row }) => (
			<StatusPill online={isOnline(row.original.lastSeenAt)} />
		),
	},
	{
		id: "volume",
		header: "Volume",
		enableSorting: false,
		cell: ({ row }) => (
			<span className="tabular-nums">{row.original.telemetry?.count ?? 0}</span>
		),
	},
	{
		id: "ttfa",
		header: "TTFA p50",
		enableSorting: false,
		cell: ({ row }) => (
			<span className="font-mono text-sm tabular-nums">
				{formatMs(row.original.telemetry?.ttfaP50 ?? null)}
			</span>
		),
	},
	{
		accessorKey: "lastInteractionAt",
		header: "Last interaction",
		cell: ({ row }) => (
			<span className="text-muted-foreground text-sm">
				{relativeTime(row.original.lastInteractionAt)}
			</span>
		),
	},
	{
		id: "address",
		header: "Address",
		enableSorting: false,
		cell: ({ row }) => (
			<span className="text-muted-foreground font-mono text-xs">
				{row.original.localIp
					? `${row.original.localIp}:${row.original.httpPort}`
					: "—"}
			</span>
		),
	},
	{
		accessorKey: "domiaKey",
		header: "Key",
		enableSorting: false,
		cell: ({ row }) => (
			<Badge variant="secondary" className="font-mono text-xs">
				{row.original.domiaKey}
			</Badge>
		),
	},
]
