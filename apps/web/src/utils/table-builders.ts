import {
	asc,
	desc,
	eq,
	gte,
	inArray,
	isNotNull,
	isNull,
	like,
	lte,
	or,
	type SQL,
} from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"
import type { FacetMapEntry, SortState, TableFilters } from "@/types/table"

export const buildSearchWhere = (
	searchColumns: SQLiteColumn[],
	search: string,
): SQL | undefined => {
	const term = search.trim()
	if (!term || searchColumns.length === 0) return undefined
	return or(...searchColumns.map((c) => like(c, `%${term}%`)))
}

export const buildOrderBy = (
	columns: Record<string, SQLiteColumn>,
	sort: SortState | null,
	fallback: SQL,
): SQL[] => {
	if (sort && columns[sort.field]) {
		return [
			sort.dir === "asc" ? asc(columns[sort.field]) : desc(columns[sort.field]),
		]
	}
	return [fallback]
}

export const buildFacetFilters = (
	map: Record<string, FacetMapEntry>,
	filters: TableFilters,
): SQL[] => {
	const out: SQL[] = []
	for (const [key, value] of Object.entries(filters)) {
		if (!value) continue
		const entry = map[key]
		if (!entry) continue
		if (entry.build) {
			const sql = entry.build(value)
			if (sql) out.push(sql)
			continue
		}
		if (!entry.column) continue
		const numeric = entry.numeric ? Number(value) : null
		if (entry.numeric && Number.isNaN(numeric)) continue
		const v = entry.numeric ? (numeric as number) : value
		switch (entry.op) {
			case "in":
				out.push(inArray(entry.column, value.split(",").filter(Boolean)))
				break
			case "like":
				out.push(like(entry.column, `%${value}%`))
				break
			case "gte":
				out.push(gte(entry.column, v))
				break
			case "lte":
				out.push(lte(entry.column, v))
				break
			case "isNull":
				out.push(isNull(entry.column))
				break
			case "isNotNull":
				out.push(isNotNull(entry.column))
				break
			default:
				out.push(eq(entry.column, v))
		}
	}
	return out
}
