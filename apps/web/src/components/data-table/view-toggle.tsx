import { LayoutGrid, Map as MapIcon, Table2 } from "lucide-react"
import { m } from "@/paraglide/messages"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ViewMode } from "@/types/table"

export function ViewToggle({
	value,
	onChange,
	withMap = false,
}: {
	value: ViewMode
	onChange: (value: ViewMode) => void
	withMap?: boolean
}) {
	return (
		<ToggleGroup
			variant="outline"
			size="sm"
			value={[value]}
			onValueChange={(group) => {
				const next = group[0]
				if (next === "table" || next === "cards" || next === "map")
					onChange(next)
			}}
		>
			<ToggleGroupItem value="cards" aria-label={m.aria_view_cards()}>
				<LayoutGrid className="size-4" />
			</ToggleGroupItem>
			{withMap ? (
				<ToggleGroupItem value="map" aria-label={m.aria_view_map()}>
					<MapIcon className="size-4" />
				</ToggleGroupItem>
			) : null}
			<ToggleGroupItem value="table" aria-label={m.aria_view_table()}>
				<Table2 className="size-4" />
			</ToggleGroupItem>
		</ToggleGroup>
	)
}
