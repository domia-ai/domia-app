import { useNavigate } from "@tanstack/react-router"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTable } from "@/components/data-table/data-table"
import { DataTablePagination } from "@/components/data-table/pagination"
import { ViewToggle } from "@/components/data-table/view-toggle"
import { useTableParams } from "@/hooks/use-table-params"
import { useTableQuery } from "@/hooks/use-table-query"
import { useViewMode } from "@/hooks/use-view-mode"
import { listFleetFn } from "@/server/fleet"
import { LIVE_REFRESH_MS } from "@/constants/conversations"
import { FleetStatsHeader } from "./fleet-stats-header"
import { DomiaCard } from "./domia-card"
import { fleetColumns } from "./columns"
import type { FleetRow } from "@/types/fleet"

export function FleetView() {
	const navigate = useNavigate()
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
	} = useTableParams()
	const [view, setView] = useViewMode("domias", "cards")

	const { data, isLoading } = useTableQuery<FleetRow>(
		"fleet",
		(params) => listFleetFn({ data: params }),
		{ page, pageSize, search, sort, filters },
		LIVE_REFRESH_MS,
	)

	const rows = data?.rows ?? []
	const total = data?.total ?? 0

	return (
		<div className="space-y-4">
			<FleetStatsHeader />
			<div className="flex items-center justify-between gap-2">
				<div className="relative max-w-xs flex-1">
					<Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
					<Input
						placeholder="Search Domias…"
						value={searchInput}
						onChange={(e) => setSearchInput(e.target.value)}
						className="pl-9"
					/>
				</div>
				<ViewToggle value={view} onChange={setView} />
			</div>

			{view === "table" ? (
				<DataTable
					columns={fleetColumns}
					data={rows}
					total={total}
					page={page}
					pageSize={pageSize}
					sort={sort}
					onPageChange={setPage}
					onPageSizeChange={setPageSize}
					onSortChange={setSort}
					isLoading={isLoading}
					emptyLabel="No Domias discovered yet."
					onRowClick={(row) =>
						navigate({ to: "/domias/$key", params: { key: row.domiaKey } })
					}
				/>
			) : (
				<div className="space-y-4">
					{isLoading ? (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{[0, 1, 2].map((i) => (
								<Skeleton key={i} className="h-48 w-full" />
							))}
						</div>
					) : rows.length ? (
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{rows.map((row) => (
								<DomiaCard key={row.domiaKey} row={row} />
							))}
						</div>
					) : (
						<div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
							No Domias discovered yet.
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
