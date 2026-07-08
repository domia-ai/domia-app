import type { ColumnDef } from "@tanstack/react-table"
import { AlertTriangle } from "lucide-react"
import { m } from "@/paraglide/messages"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { relativeTimeMs } from "@/utils/format"
import {
	StatusIndicator,
	ProtocolBadge,
	CapabilityChips,
	satelliteStatus,
	satelliteLastSeen,
	satelliteCaps,
} from "./satellite-bits"
import type { SatelliteWithContext } from "@/types/satellites"

export const satelliteColumns: ColumnDef<SatelliteWithContext>[] = [
	{
		id: "status",
		header: () => m.sat_col_status(),
		enableSorting: false,
		cell: ({ row }) => {
			const s = row.original
			const status = satelliteStatus(s)
			return (
				<div className="flex flex-col gap-1">
					<StatusIndicator status={status} />
					{status === "error" && s.lastError ? (
						<span className="text-destructive flex items-center gap-1 text-[11px]">
							<AlertTriangle className="size-3 shrink-0" />
							<span className="max-w-40 truncate">{s.lastError}</span>
						</span>
					) : null}
				</div>
			)
		},
	},
	{
		id: "satellite",
		header: () => m.sat_col_satellite(),
		enableSorting: false,
		cell: ({ row }) => (
			<div className="flex min-w-0 items-center gap-2">
				<span className="truncate font-medium">
					{row.original.name ?? row.original.satelliteId}
				</span>
				<ProtocolBadge protocol={row.original.protocol} />
			</div>
		),
	},
	{
		id: "domia",
		header: () => m.sat_col_assigned(),
		enableSorting: false,
		cell: ({ row }) => (
			<div className="flex min-w-0 items-center gap-2">
				<PersonaAvatar
					domiaKey={row.original.domiaKey}
					name={row.original.domiaName}
					avatarId={row.original.avatarId}
					size="sm"
				/>
				<span className="text-muted-foreground truncate">
					{row.original.domiaName}
				</span>
			</div>
		),
	},
	{
		id: "capabilities",
		header: () => m.sat_col_capabilities(),
		enableSorting: false,
		cell: ({ row }) => <CapabilityChips caps={satelliteCaps(row.original)} />,
	},
	{
		id: "lastSeen",
		header: () => m.sat_col_last_seen(),
		enableSorting: false,
		cell: ({ row }) => {
			const lastSeen = satelliteLastSeen(row.original)
			return (
				<div className="min-w-0 leading-tight">
					<div className="text-foreground text-xs">
						{lastSeen ? relativeTimeMs(lastSeen) : "—"}
					</div>
					<div className="text-muted-foreground truncate font-mono text-[11px]">
						{row.original.host}
					</div>
				</div>
			)
		},
	},
]
