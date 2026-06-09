import { LayoutGrid, Table2 } from "lucide-react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { ViewMode } from "@/types/table"

export function ViewToggle({
	value,
	onChange,
}: {
	value: ViewMode
	onChange: (value: ViewMode) => void
}) {
	return (
		<ToggleGroup
			variant="outline"
			size="sm"
			value={[value]}
			onValueChange={(group) => {
				const next = group[0]
				if (next === "table" || next === "cards") onChange(next)
			}}
		>
			<ToggleGroupItem value="cards" aria-label="Card view">
				<LayoutGrid className="size-4" />
			</ToggleGroupItem>
			<ToggleGroupItem value="table" aria-label="Table view">
				<Table2 className="size-4" />
			</ToggleGroupItem>
		</ToggleGroup>
	)
}
