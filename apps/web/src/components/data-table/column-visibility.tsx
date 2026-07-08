import { SlidersHorizontal } from "lucide-react"
import { m } from "@/paraglide/messages"
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type { ColumnVisibilityProps } from "@/types/table"

export function ColumnVisibility({
	columns,
	visibility,
	onChange,
}: ColumnVisibilityProps) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger className="text-muted-foreground hover:bg-muted hover:text-foreground inline-flex h-8 items-center gap-1.5 rounded-md border px-2.5 text-sm outline-none">
				<SlidersHorizontal className="size-3.5" />
				{m.table_columns()}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>{m.table_toggle_columns()}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				{columns.map((col) => (
					<DropdownMenuCheckboxItem
						key={col.id}
						checked={visibility[col.id] !== false}
						onCheckedChange={(value) =>
							onChange({ ...visibility, [col.id]: !!value })
						}
					>
						{col.label()}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
