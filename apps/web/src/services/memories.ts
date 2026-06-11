import { and, count, desc, eq, getTableColumns } from "drizzle-orm"
import { domiaRegistry, memoryFact } from "@domia-app/db"
import { db } from "@/db"
import { buildOrderBy, buildSearchWhere } from "@/utils/table-builders"
import type { FilterFacetOption, Paginated, TableParams } from "@/types/table"
import type { MemoryFactRow } from "@/types/memories"

const SEARCH_COLUMNS = [
	memoryFact.subject,
	memoryFact.relation,
	memoryFact.value,
]

const SORTABLE = {
	confidence: memoryFact.confidence,
	updatedAt: memoryFact.updatedAt,
}

export const listFacts = async (
	params: TableParams,
): Promise<Paginated<MemoryFactRow>> => {
	const where = and(
		buildSearchWhere(SEARCH_COLUMNS, params.search),
		params.filters.domia
			? eq(memoryFact.sourceDomiaKey, params.filters.domia)
			: undefined,
	)
	const orderBy = buildOrderBy(
		SORTABLE,
		params.sort,
		desc(memoryFact.updatedAt),
	)

	const rows = await db
		.select({
			...getTableColumns(memoryFact),
			domiaName: domiaRegistry.name,
			domiaAvatarId: domiaRegistry.avatarId,
		})
		.from(memoryFact)
		.leftJoin(
			domiaRegistry,
			eq(memoryFact.sourceDomiaKey, domiaRegistry.domiaKey),
		)
		.where(where)
		.orderBy(...orderBy)
		.limit(params.pageSize)
		.offset(params.page * params.pageSize)

	const [totals] = await db
		.select({ value: count() })
		.from(memoryFact)
		.where(where)

	return { rows: rows as MemoryFactRow[], total: totals?.value ?? 0 }
}

export const getFactDomiaOptions = async (): Promise<FilterFacetOption[]> => {
	const rows = await db
		.selectDistinct({
			key: memoryFact.sourceDomiaKey,
			name: domiaRegistry.name,
		})
		.from(memoryFact)
		.leftJoin(
			domiaRegistry,
			eq(memoryFact.sourceDomiaKey, domiaRegistry.domiaKey),
		)

	return rows.map((r) => ({ label: r.name ?? r.key, value: r.key }))
}

export const getFactCount = async (): Promise<number> => {
	const [t] = await db.select({ value: count() }).from(memoryFact)
	return t?.value ?? 0
}
