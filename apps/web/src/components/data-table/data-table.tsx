import {
	type ColumnDef,
	type SortingState,
	flexRender,
	getCoreRowModel,
	useReactTable,
} from "@tanstack/react-table"
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import type { DataTableProps } from "@/types/table"
import { DataTablePagination } from "./pagination"

export function DataTable<TData, TValue>({
	columns,
	data,
	total,
	page,
	pageSize,
	sort,
	onPageChange,
	onPageSizeChange,
	onSortChange,
	isLoading,
	emptyLabel = "No results.",
	onRowClick,
	toolbar,
	rowActions,
	columnVisibility,
	onColumnVisibilityChange,
	enableSelection,
	rowId,
	rowSelection,
	onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
	const sorting: SortingState = sort
		? [{ id: sort.field, desc: sort.dir === "desc" }]
		: []

	const selectionColumn: ColumnDef<TData, TValue> = {
		id: "__select",
		header: ({ table }) => (
			<Checkbox
				checked={table.getIsAllPageRowsSelected()}
				indeterminate={
					table.getIsSomePageRowsSelected() && !table.getIsAllPageRowsSelected()
				}
				onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
				aria-label="Select all"
			/>
		),
		cell: ({ row }) => (
			<div onClick={(e) => e.stopPropagation()}>
				<Checkbox
					checked={row.getIsSelected()}
					onCheckedChange={(value) => row.toggleSelected(!!value)}
					aria-label="Select row"
				/>
			</div>
		),
		enableSorting: false,
		enableHiding: false,
	}

	const actionsColumn: ColumnDef<TData, TValue> = {
		id: "__actions",
		header: () => null,
		cell: ({ row }) => (
			<div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
				{rowActions?.(row.original)}
			</div>
		),
		enableSorting: false,
		enableHiding: false,
		meta: { className: "bg-background sticky right-0 border-l" },
	}

	const finalColumns = [
		...(enableSelection ? [selectionColumn] : []),
		...columns,
		...(rowActions ? [actionsColumn] : []),
	]

	const table = useReactTable({
		data,
		columns: finalColumns,
		state: {
			sorting,
			pagination: { pageIndex: page, pageSize },
			columnVisibility: columnVisibility ?? {},
			rowSelection: rowSelection ?? {},
		},
		manualPagination: true,
		manualSorting: true,
		rowCount: total,
		enableRowSelection: enableSelection,
		getRowId: rowId,
		getCoreRowModel: getCoreRowModel(),
		onColumnVisibilityChange: (updater) => {
			if (!onColumnVisibilityChange) return
			const next =
				typeof updater === "function"
					? updater(columnVisibility ?? {})
					: updater
			onColumnVisibilityChange(next)
		},
		onRowSelectionChange: (updater) => {
			if (!onRowSelectionChange) return
			const next =
				typeof updater === "function" ? updater(rowSelection ?? {}) : updater
			onRowSelectionChange(next)
		},
		onSortingChange: (updater) => {
			const next = typeof updater === "function" ? updater(sorting) : updater
			const first = next[0]
			onSortChange(
				first ? { field: first.id, dir: first.desc ? "desc" : "asc" } : null,
			)
		},
	})

	const colCount = table.getAllLeafColumns().length
	const skeletonRows = Math.min(pageSize, 8)

	return (
		<div className="space-y-4">
			{toolbar}
			<div className="rounded-lg border">
				<Table>
					<TableHeader className="bg-muted/50">
						{table.getHeaderGroups().map((hg) => (
							<TableRow key={hg.id} className="hover:bg-transparent">
								{hg.headers.map((header) => {
									const canSort = header.column.getCanSort()
									const sorted = header.column.getIsSorted()
									return (
										<TableHead
											key={header.id}
											className={
												(
													header.column.columnDef.meta as
														| { className?: string }
														| undefined
												)?.className
											}
										>
											{header.isPlaceholder ? null : canSort ? (
												<button
													type="button"
													className="hover:text-foreground -ml-1 inline-flex items-center gap-1 rounded px-1"
													onClick={header.column.getToggleSortingHandler()}
												>
													{flexRender(
														header.column.columnDef.header,
														header.getContext(),
													)}
													{sorted === "asc" ? (
														<ArrowUp className="size-3.5" />
													) : sorted === "desc" ? (
														<ArrowDown className="size-3.5" />
													) : (
														<ChevronsUpDown className="size-3.5 opacity-40" />
													)}
												</button>
											) : (
												flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)
											)}
										</TableHead>
									)
								})}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: skeletonRows }).map((_, i) => (
								<TableRow key={i}>
									{Array.from({ length: colCount }).map((_, j) => (
										<TableCell key={j}>
											<Skeleton className="h-5 w-full" />
										</TableCell>
									))}
								</TableRow>
							))
						) : table.getRowModel().rows.length ? (
							table.getRowModel().rows.map((row) => (
								<TableRow
									key={row.id}
									data-state={row.getIsSelected() && "selected"}
									className={cn(onRowClick && "cursor-pointer")}
									onClick={
										onRowClick ? () => onRowClick(row.original) : undefined
									}
								>
									{row.getVisibleCells().map((cell) => (
										<TableCell
											key={cell.id}
											className={
												(
													cell.column.columnDef.meta as
														| { className?: string }
														| undefined
												)?.className
											}
										>
											{flexRender(
												cell.column.columnDef.cell,
												cell.getContext(),
											)}
										</TableCell>
									))}
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={colCount}
									className="text-muted-foreground h-24 text-center"
								>
									{emptyLabel}
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
			<DataTablePagination
				page={page}
				pageSize={pageSize}
				total={total}
				onPageChange={onPageChange}
				onPageSizeChange={onPageSizeChange}
			/>
		</div>
	)
}
