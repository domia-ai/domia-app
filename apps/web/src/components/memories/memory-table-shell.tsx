import { Search } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { DataTable } from "@/components/data-table/data-table"
import { DataTablePagination } from "@/components/data-table/pagination"
import { ViewToggle } from "@/components/data-table/view-toggle"
import { useDataQuery } from "@/hooks/use-query-state"
import { useTableParams } from "@/hooks/use-table-params"
import { useTableQuery } from "@/hooks/use-table-query"
import { useViewMode } from "@/hooks/use-view-mode"
import type { MemoryTableShellProps } from "@/types/memories"

const FILTER_KEYS = ["domia"]

export function MemoryTableShell<TRow extends { id: string }>({
	viewKey,
	queryKey,
	fetcher,
	domiaOptionsQueryKey,
	domiaOptionsFn,
	columns,
	renderCard,
	cardSkeletonClassName,
	searchPlaceholder,
	loadFailedLabel,
	emptyLabel,
	emptyHint,
}: MemoryTableShellProps<TRow>) {
	const {
		page,
		pageSize,
		search,
		sort,
		filters,
		searchInput,
		setSearchInput,
		setPage,
		setPageSize,
		setSort,
		setFilter,
	} = useTableParams(FILTER_KEYS)
	const [view, setView] = useViewMode(viewKey, "cards")

	const { data, isLoading, isError } = useTableQuery<TRow>(queryKey, fetcher, {
		page,
		pageSize,
		search,
		sort,
		filters,
	})
	const { state: domiaState } = useDataQuery({
		queryKey: [domiaOptionsQueryKey],
		queryFn: domiaOptionsFn,
		errorMessage: m.mem_domias_error,
	})

	const loadFailed = isError && !data
	const rows = data?.rows ?? []
	const total = data?.total ?? 0
	const domiaOptions = domiaState.status === "ready" ? domiaState.data : []

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-1 flex-wrap items-center gap-2">
					<div className="relative max-w-xs flex-1">
						<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							placeholder={searchPlaceholder}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="pl-9"
						/>
					</div>
					{domiaState.status === "loading" && <Skeleton className="h-9 w-44" />}
					{domiaState.status === "error" && (
						<p className="text-destructive text-xs">{domiaState.message}</p>
					)}
					{domiaOptions.length > 0 && (
						<Select
							value={filters.domia ?? "all"}
							onValueChange={(v) => setFilter("domia", v === "all" ? null : v)}
							items={[
								{ value: "all", label: m.mem_all_domias() },
								...domiaOptions,
							]}
						>
							<SelectTrigger className="h-9 w-44">
								<SelectValue placeholder={m.mem_all_domias()} />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">{m.mem_all_domias()}</SelectItem>
								{domiaOptions.map((o) => (
									<SelectItem key={o.value} value={o.value}>
										{o.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}
				</div>
				<ViewToggle value={view} onChange={setView} />
			</div>

			{view === "table" ? (
				<DataTable
					columns={columns}
					data={rows}
					total={total}
					page={page}
					pageSize={pageSize}
					sort={sort}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSortChange={setSort}
					isLoading={isLoading}
					emptyLabel={loadFailed ? loadFailedLabel : emptyLabel}
				/>
			) : (
				<div className="space-y-4">
					{isLoading ? (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{[0, 1, 2].map((i) => (
								<Skeleton key={i} className={cardSkeletonClassName} />
							))}
						</div>
					) : rows.length ? (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{rows.map((r) => renderCard(r))}
						</div>
					) : (
						<div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
							{loadFailed ? loadFailedLabel : emptyHint}
						</div>
					)}
					{total > pageSize && (
						<DataTablePagination
							page={page}
							pageSize={pageSize}
							total={total}
							onPageChange={setPage}
							onPageSizeChange={setPageSize}
						/>
					)}
				</div>
			)}
		</div>
	)
}
