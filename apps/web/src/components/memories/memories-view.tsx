import { Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
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
import { useTableParams } from "@/hooks/use-table-params"
import { useTableQuery } from "@/hooks/use-table-query"
import { useViewMode } from "@/hooks/use-view-mode"
import { getFactDomiaOptionsFn, listFactsFn } from "@/server/memories"
import { memoryColumns } from "./columns"
import { FactCard } from "./fact-card"
import type { MemoryFactRow } from "@/types/memories"

const FILTER_KEYS = ["domia"]

export function MemoriesView() {
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
	const [view, setView] = useViewMode("memories", "cards")

	const { data, isLoading, isError } = useTableQuery<MemoryFactRow>(
		"memories",
		(p) => listFactsFn({ data: p }),
		{ page, pageSize, search, sort, filters },
	)
	const domiaQuery = useQuery({
		queryKey: ["memory-domia-options"],
		queryFn: () => getFactDomiaOptionsFn(),
	})

	const loadFailed = isError && !data
	const rows = data?.rows ?? []
	const total = data?.total ?? 0
	const domiaOptions = domiaQuery.data ?? []

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<div className="flex flex-1 flex-wrap items-center gap-2">
					<div className="relative max-w-xs flex-1">
						<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
						<Input
							placeholder={m.mem_search_placeholder()}
							value={searchInput}
							onChange={(e) => setSearchInput(e.target.value)}
							className="pl-9"
						/>
					</div>
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
					columns={memoryColumns}
					data={rows}
					total={total}
					page={page}
					pageSize={pageSize}
					sort={sort}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSortChange={setSort}
					isLoading={isLoading}
					emptyLabel={loadFailed ? m.mem_load_failed() : m.mem_empty()}
				/>
			) : (
				<div className="space-y-4">
					{isLoading ? (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{[0, 1, 2].map((i) => (
								<Skeleton key={i} className="h-36 w-full" />
							))}
						</div>
					) : rows.length ? (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{rows.map((r) => (
								<FactCard key={r.id} row={r} />
							))}
						</div>
					) : (
						<div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
							{loadFailed ? m.mem_load_failed() : m.mem_empty_hint()}
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
