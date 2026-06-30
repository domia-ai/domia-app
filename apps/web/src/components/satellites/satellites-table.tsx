import { Volume2, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/data-table/data-table"
import { satelliteColumns } from "./columns"
import { satelliteCaps } from "./satellite-bits"
import type {
	SatellitesTableProps,
	SatelliteWithContext,
} from "@/types/satellites"

export function SatellitesTable({
	satellites,
	selectedId,
	onSelect,
	onTestSpeaker,
	onAnnounce,
}: SatellitesTableProps) {
	const rowActions = (s: SatelliteWithContext) => {
		const caps = satelliteCaps(s)
		return (
			<div className="flex items-center gap-1">
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Test speaker"
					disabled={!caps.speaker || !s.online}
					onClick={() => onTestSpeaker(s)}
				>
					<Volume2 className="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon-sm"
					aria-label="Announce"
					disabled={!caps.announce || !s.online}
					onClick={() => onAnnounce(s)}
				>
					<Megaphone className="size-4" />
				</Button>
			</div>
		)
	}

	return (
		<DataTable
			columns={satelliteColumns}
			data={satellites}
			total={satellites.length}
			page={0}
			pageSize={Math.max(satellites.length, 1)}
			sort={null}
			onPageChange={() => {}}
			onPageSizeChange={() => {}}
			onSortChange={() => {}}
			onRowClick={onSelect}
			selectedRowId={selectedId}
			rowId={(s) => s.id}
			rowActions={rowActions}
			emptyLabel="No satellites bound yet."
		/>
	)
}
