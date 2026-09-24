import { useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { DataTable } from "@/components/data-table/data-table"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTableToolbar } from "@/components/data-table/data-table-toolbar"
import { useDataQuery } from "@/hooks/use-query-state"
import { useTableParams } from "@/hooks/use-table-params"
import { useTableQuery } from "@/hooks/use-table-query"
import { tableParamsToQuery } from "@/utils/table-params"
import {
	listInteractionsFn,
	getConversationFacetsFn,
} from "@/server/conversations"
import { m } from "@/paraglide/messages"
import {
	conversationFacets,
	CONVERSATION_FILTER_KEYS,
	DEFAULT_VISIBLE_COLUMNS,
	PRESETS,
	TOGGLEABLE_COLUMNS,
} from "@/constants/conversations"
import { useConsolePrefs } from "@/components/providers/console-prefs"
import { conversationColumns } from "./columns"
import { RowActions } from "./row-actions"
import { BulkActions } from "./bulk-actions"
import type { ConversationRow, ConversationFacets } from "@/types/conversations"
import type { RowSelectionState } from "@tanstack/react-table"

const EMPTY_FACETS: ConversationFacets = {
	llmModel: [],
	sttModel: [],
	ttsEngine: [],
	ttsVoice: [],
	domiaOptions: [],
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

	const { liveRefreshMs } = useConsolePrefs()
	const { data, isLoading, isError } = useTableQuery<ConversationRow>(
		"conversations",
		(p) => listInteractionsFn({ data: p }),
		params,
		tp.filters.live === "1" ? liveRefreshMs : undefined,
	)

	const { state: facetsState } = useDataQuery<ConversationFacets>({
		queryKey: ["conversation-facets"],
		queryFn: () => getConversationFacetsFn(),
		errorMessage: m.conv_facets_error,
	})

	const facets =
		facetsState.status === "ready" ? facetsState.data : EMPTY_FACETS
	const domiaFacetOptions = facets.domiaOptions

	const loadFailed = isError && !data
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
			emptyLabel={loadFailed ? m.conv_load_error() : m.conv_empty()}
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
					{facetsState.status === "loading" && (
						<Skeleton className="h-4 w-48" />
					)}
					{facetsState.status === "error" && (
						<p className="text-muted-foreground text-xs">
							{facetsState.message}
						</p>
					)}
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
						searchPlaceholder={m.conv_search_placeholder()}
						facets={conversationFacets()}
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
