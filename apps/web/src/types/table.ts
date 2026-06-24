import type {
	ColumnDef,
	RowSelectionState,
	VisibilityState,
} from "@tanstack/react-table"
import type { ReactNode } from "react"
import type { SQL } from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"

export type SortDir = "asc" | "desc"

export type SortState = { field: string; dir: SortDir }

export type TableFilters = Record<string, string>

export type TableParams = {
	page: number
	pageSize: number
	search: string
	sort: SortState | null
	filters: TableFilters
}

export type Paginated<T> = { rows: T[]; total: number }

export type FilterFacetOption = {
	label: string
	value: string
	color?: string
}

export type FilterFacet = {
	key: string
	label: string
	type: "select" | "chips" | "multiselect" | "toggle"
	options?: FilterFacetOption[]
}

export type TablePreset = {
	key: string
	label: string
	params: Record<string, string | null>
}

export type FacetOp =
	| "eq"
	| "like"
	| "in"
	| "gte"
	| "lte"
	| "isNull"
	| "isNotNull"

export type FacetMapEntry = {
	column?: SQLiteColumn
	op?: FacetOp
	numeric?: boolean
	build?: (value: string) => SQL | undefined
}

export type DataTableToolbarProps = {
	searchInput: string
	setSearchInput: (value: string) => void
	searchPlaceholder?: string
	facets?: FilterFacet[]
	facetOptions?: Record<string, FilterFacetOption[]>
	filters: TableFilters
	setFilter: (key: string, value: string | null) => void
	applyParams: (changes: Record<string, string | null>) => void
	presets?: TablePreset[]
	filterKeys?: string[]
	columnToggles?: ColumnToggle[]
	columnVisibility?: Record<string, boolean>
	setColumnVisibility?: (value: Record<string, boolean>) => void
	exportHref?: string
}

export type ColumnToggle = { id: string; label: string }

export type ColumnVisibilityProps = {
	columns: ColumnToggle[]
	visibility: Record<string, boolean>
	onChange: (value: Record<string, boolean>) => void
}

export type DataTableProps<TData, TValue> = {
	columns: ColumnDef<TData, TValue>[]
	data: TData[]
	total: number
	page: number
	pageSize: number
	sort: SortState | null
	onPageChange: (page: number) => void
	onPageSizeChange: (size: number) => void
	onSortChange: (sort: SortState | null) => void
	isLoading?: boolean
	emptyLabel?: string
	onRowClick?: (row: TData) => void
	toolbar?: ReactNode
	rowActions?: (row: TData) => ReactNode
	columnVisibility?: VisibilityState
	onColumnVisibilityChange?: (value: VisibilityState) => void
	enableSelection?: boolean
	rowId?: (row: TData) => string
	rowSelection?: RowSelectionState
	onRowSelectionChange?: (value: RowSelectionState) => void
}

export type ViewMode = "table" | "cards" | "map"
