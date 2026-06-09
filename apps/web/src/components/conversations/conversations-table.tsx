import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { DataTable } from "@/components/data-table/data-table"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { useTableParams } from "@/hooks/use-table-params"
import { useTableQuery } from "@/hooks/use-table-query"
import { tableParamsToQuery } from "@/utils/table-params"
import {
	listInteractionsFn,
	getSnapshotFacetOptionsFn,
} from "@/server/conversations"
import { listFleetFn } from "@/server/fleet"
import {
	CONVERSATION_FACETS,
	CONVERSATION_FILTER_KEYS,
	DEFAULT_VISIBLE_COLUMNS,
	LIVE_REFRESH_MS,
	PRESETS,
	TOGGLEABLE_COLUMNS,
} from "@/constants/conversations"
import { conversationColumns } from "./columns"
import { RowActions } from "./row-actions"
import { BulkActions } from "./bulk-actions"
import type {
	ConversationRow,
	DomiaOption,
	SnapshotFacetOptions,
} from "@/types/conversations"
import type { FilterFacetOption } from "@/types/table"
import type { RowSelectionState } from "@tanstack/react-table"

const EMPTY_FACETS: SnapshotFacetOptions = {
	llmModel: [],
	sttModel: [],
	ttsEngine: [],
	ttsVoice: [],
}

export function ConversationsTable() {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const tp = useTableParams(CONVERSATION_FILTER_KEYS)
	const [columnVisibility, setColumnVisibility] = useState<
		Record<string, boolean>
	>(DEFAULT_VISIBLE_COLUMNS)
	const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

	const params = {
		page: tp.page,
		pageSize: tp.pageSize,
		search: tp.search,
		sort: tp.sort,
		filters: tp.filters,
	}

	const { data, isLoading } = useTableQuery<ConversationRow>(
		"conversations",
		(p) => listInteractionsFn({ data: p }),
		params,
		tp.filters.live === "1" ? LIVE_REFRESH_MS : undefined,
	)

	const { data: domiaOptions } = useQuery({
		queryKey: ["domia-options"],
		queryFn: async (): Promise<DomiaOption[]> => {
			const page = await listFleetFn({
				data: {
					page: 0,
					pageSize: 100,
					search: "",
					sort: null,
					filters: {},
				},
			})
			return page.rows.map((r) => ({ domiaKey: r.domiaKey, name: r.name }))
		},
	})

	const { data: snapshotFacets } = useQuery({
		queryKey: ["conversation-facets"],
		queryFn: () => getSnapshotFacetOptionsFn(),
	})

	const facets = snapshotFacets ?? EMPTY_FACETS
	const domiaFacetOptions: FilterFacetOption[] = (domiaOptions ?? []).map(
		(d) => ({ label: d.name ?? d.domiaKey, value: d.domiaKey }),
	)

	const rows = data?.rows ?? []
	const selectedRows = rows.filter((r) => rowSelection[r.id])
	const exportHref = `/api/conversations/export?${tableParamsToQuery(params)}`

	const onGraded = () => {
		setRowSelection({})
		queryClient.invalidateQueries({ queryKey: ["conversations"] })
		queryClient.invalidateQueries({ queryKey: ["conversation-stats"] })
	}

	return (
		<DataTable<ConversationRow, unknown>
			columns={conversationColumns}
			data={rows}
			total={data?.total ?? 0}
			page={tp.page}
			pageSize={tp.pageSize}
			sort={tp.sort}
			onPageChange={tp.setPage}
			onPageSizeChange={tp.setPageSize}
			onSortChange={tp.setSort}
			isLoading={isLoading}
			emptyLabel="No conversations recorded yet."
			onRowClick={(row) =>
				navigate({ to: "/conversations/$id", params: { id: row.id } })
			}
			columnVisibility={columnVisibility}
			onColumnVisibilityChange={setColumnVisibility}
			enableSelection
			rowId={(row) => row.id}
			rowSelection={rowSelection}
			onRowSelectionChange={setRowSelection}
			rowActions={(row) => <RowActions row={row} />}
			toolbar={
				<div className="space-y-3">
					{selectedRows.length > 0 && (
						<BulkActions
							rows={selectedRows}
							onClear={() => setRowSelection({})}
							onGraded={onGraded}
						/>
					)}
					<DataTableToolbar
						searchInput={tp.searchInput}
						setSearchInput={tp.setSearchInput}
						searchPlaceholder="Search transcripts, responses…"
						facets={CONVERSATION_FACETS}
						facetOptions={{
							domia: domiaFacetOptions,
							llmModel: facets.llmModel,
							sttModel: facets.sttModel,
							ttsEngine: facets.ttsEngine,
							ttsVoice: facets.ttsVoice,
						}}
						filters={tp.filters}
						setFilter={tp.setFilter}
						applyParams={tp.applyParams}
						presets={PRESETS}
						filterKeys={CONVERSATION_FILTER_KEYS}
						columnToggles={TOGGLEABLE_COLUMNS}
						columnVisibility={columnVisibility}
						setColumnVisibility={setColumnVisibility}
						exportHref={exportHref}
					/>
				</div>
			}
		/>
	)
}
