import {
	ChevronLeft,
	ChevronRight,
	ChevronsLeft,
	ChevronsRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { PAGE_SIZE_OPTIONS } from "@/constants/table"

type Props = {
	page: number
	pageSize: number
	total: number
	onPageChange: (page: number) => void
	onPageSizeChange: (size: number) => void
}

export function DataTablePagination({
	page,
	pageSize,
	total,
	onPageChange,
	onPageSizeChange,
}: Props) {
	const pageCount = Math.max(1, Math.ceil(total / pageSize))
	const from = total === 0 ? 0 : page * pageSize + 1
	const to = Math.min(total, (page + 1) * pageSize)

	return (
		<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
			<p className="text-muted-foreground text-sm">
				{from}–{to} of {total}
			</p>
			<div className="flex items-center gap-4 sm:gap-6">
				<div className="flex items-center gap-2">
					<span className="text-muted-foreground text-sm">Rows</span>
					<Select
						value={String(pageSize)}
						onValueChange={(v) => onPageSizeChange(Number(v))}
					>
						<SelectTrigger className="h-8 w-[72px]">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{PAGE_SIZE_OPTIONS.map((s) => (
								<SelectItem key={s} value={String(s)}>
									{s}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>
				<span className="text-muted-foreground text-sm">
					Page {page + 1} of {pageCount}
				</span>
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => onPageChange(0)}
						disabled={page === 0}
					>
						<ChevronsLeft className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => onPageChange(page - 1)}
						disabled={page === 0}
					>
						<ChevronLeft className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => onPageChange(page + 1)}
						disabled={page >= pageCount - 1}
					>
						<ChevronRight className="size-4" />
					</Button>
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						onClick={() => onPageChange(pageCount - 1)}
						disabled={page >= pageCount - 1}
					>
						<ChevronsRight className="size-4" />
					</Button>
				</div>
			</div>
		</div>
	)
}
