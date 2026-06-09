import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from "@/constants/table"
import type { SortState, TableFilters, TableParams } from "@/types/table"

type Getter = (key: string) => string | undefined

export const parseTableParams = (
	get: Getter,
	filterKeys: string[] = [],
): TableParams => {
	const rawPage = parseInt(get("page") ?? "1", 10)
	const page = Number.isNaN(rawPage) || rawPage < 1 ? 0 : rawPage - 1

	const rawSize = parseInt(get("size") ?? String(DEFAULT_PAGE_SIZE), 10)
	const pageSize = PAGE_SIZE_OPTIONS.includes(rawSize)
		? rawSize
		: DEFAULT_PAGE_SIZE

	const search = get("q") ?? ""
	const sortField = get("sort")
	const sortDir: SortState["dir"] = get("dir") === "asc" ? "asc" : "desc"
	const sort: SortState | null = sortField
		? { field: sortField, dir: sortDir }
		: null

	const filters: TableFilters = {}
	for (const key of filterKeys) {
		const value = get(key)
		if (value) filters[key] = value
	}

	return { page, pageSize, search, sort, filters }
}

export const tableParamsToQuery = (params: TableParams): string => {
	const sp = new URLSearchParams()
	sp.set("page", String(params.page + 1))
	sp.set("size", String(params.pageSize))
	if (params.search) sp.set("q", params.search)
	if (params.sort) {
		sp.set("sort", params.sort.field)
		sp.set("dir", params.sort.dir)
	}
	for (const [key, value] of Object.entries(params.filters ?? {})) {
		if (value) sp.set(key, value)
	}
	return sp.toString()
}

export const validateTableSearch = (
	search: Record<string, unknown>,
): Record<string, string> => {
	const out: Record<string, string> = {}
	for (const [key, value] of Object.entries(search)) {
		if (value != null && value !== "") out[key] = String(value)
	}
	return out
}

export const tableQueryKey = (key: string, params: TableParams) =>
	[
		key,
		params.page,
		params.pageSize,
		params.search,
		params.sort?.field ?? null,
		params.sort?.dir ?? null,
		JSON.stringify(params.filters ?? {}),
	] as const
