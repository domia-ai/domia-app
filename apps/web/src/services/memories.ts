import {
	and,
	count,
	desc,
	eq,
	getTableColumns,
	isNull,
	max,
	sql,
} from "drizzle-orm"
import {
	domiaRegistry,
	factEvidence,
	interactionTrace,
	memoryEpisode,
	memoryFact,
	userModel,
} from "@domia-app/db"
import { db } from "@/db"
import { buildOrderBy, buildSearchWhere } from "@/utils/table-builders"
import type { FilterFacetOption, Paginated, TableParams } from "@/types/table"
import type {
	FactEvidenceLink,
	MemoryCounts,
	MemoryEpisodeRow,
	MemoryFactRow,
	UserModelView,
} from "@/types/memories"

const EVIDENCE_LINK_LIMIT = 12

const SEARCH_COLUMNS = [
	memoryFact.subject,
	memoryFact.relation,
	memoryFact.value,
]

const SORTABLE = {
	confidence: memoryFact.confidence,
	updatedAt: memoryFact.updatedAt,
}

const EPISODE_SEARCH_COLUMNS = [
	memoryEpisode.summary,
	memoryEpisode.moodArc,
	memoryEpisode.topics,
]

const EPISODE_SORTABLE = {
	createdAt: memoryEpisode.createdAt,
}

const evidenceTotals = db
	.select({
		factId: factEvidence.factId,
		total: count().as("evidence_total"),
	})
	.from(factEvidence)
	.groupBy(factEvidence.factId)
	.as("evidence_totals")

const sessionTotals = db
	.select({
		sessionId: interactionTrace.sessionId,
		turns: count().as("session_turns"),
		sessionTraceId: max(interactionTrace.interactionSessionTraceId).as(
			"session_trace_id",
		),
	})
	.from(interactionTrace)
	.groupBy(interactionTrace.sessionId)
	.as("session_totals")

const factTotals = db
	.select({
		domiaKey: memoryFact.sourceDomiaKey,
		total: count().as("fact_total"),
	})
	.from(memoryFact)
	.where(isNull(memoryFact.supersededAt))
	.groupBy(memoryFact.sourceDomiaKey)
	.as("fact_totals")

const episodeTotals = db
	.select({
		domiaKey: memoryEpisode.sourceDomiaKey,
		total: count().as("episode_total"),
	})
	.from(memoryEpisode)
	.groupBy(memoryEpisode.sourceDomiaKey)
	.as("episode_totals")

export const listFacts = async (
	params: TableParams,
): Promise<Paginated<MemoryFactRow>> => {
	const where = and(
		buildSearchWhere(SEARCH_COLUMNS, params.search),
		params.filters.superseded === "all"
			? undefined
			: isNull(memoryFact.supersededAt),
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
			evidenceCount: sql<number>`coalesce(${evidenceTotals.total}, 0)`,
		})
		.from(memoryFact)
		.leftJoin(
			domiaRegistry,
			eq(memoryFact.sourceDomiaKey, domiaRegistry.domiaKey),
		)
		.leftJoin(evidenceTotals, eq(evidenceTotals.factId, memoryFact.id))
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

export const listEpisodes = async (
	params: TableParams,
): Promise<Paginated<MemoryEpisodeRow>> => {
	const where = and(
		buildSearchWhere(EPISODE_SEARCH_COLUMNS, params.search),
		params.filters.domia
			? eq(memoryEpisode.sourceDomiaKey, params.filters.domia)
			: undefined,
	)
	const orderBy = buildOrderBy(
		EPISODE_SORTABLE,
		params.sort,
		desc(memoryEpisode.createdAt),
	)

	const rows = await db
		.select({
			...getTableColumns(memoryEpisode),
			domiaName: domiaRegistry.name,
			domiaAvatarId: domiaRegistry.avatarId,
			turnCount: sql<number>`coalesce(${sessionTotals.turns}, 0)`,
			sessionTraceId: sessionTotals.sessionTraceId,
		})
		.from(memoryEpisode)
		.leftJoin(
			domiaRegistry,
			eq(memoryEpisode.sourceDomiaKey, domiaRegistry.domiaKey),
		)
		.leftJoin(
			sessionTotals,
			eq(sessionTotals.sessionId, memoryEpisode.sessionId),
		)
		.where(where)
		.orderBy(...orderBy)
		.limit(params.pageSize)
		.offset(params.page * params.pageSize)

	const [totals] = await db
		.select({ value: count() })
		.from(memoryEpisode)
		.where(where)

	return { rows: rows as MemoryEpisodeRow[], total: totals?.value ?? 0 }
}

export const listUserModels = async (): Promise<UserModelView[]> => {
	const rows = await db
		.select({
			...getTableColumns(userModel),
			domiaName: domiaRegistry.name,
			domiaAvatarId: domiaRegistry.avatarId,
			factCount: sql<number>`coalesce(${factTotals.total}, 0)`,
			episodeCount: sql<number>`coalesce(${episodeTotals.total}, 0)`,
		})
		.from(userModel)
		.leftJoin(
			domiaRegistry,
			eq(userModel.sourceDomiaKey, domiaRegistry.domiaKey),
		)
		.leftJoin(factTotals, eq(factTotals.domiaKey, userModel.sourceDomiaKey))
		.leftJoin(
			episodeTotals,
			eq(episodeTotals.domiaKey, userModel.sourceDomiaKey),
		)
		.orderBy(desc(userModel.updatedAt))

	return rows as UserModelView[]
}

export const listFactEvidence = async (
	factId: string,
): Promise<FactEvidenceLink[]> => {
	const rows = await db
		.select({
			id: factEvidence.id,
			interactionId: factEvidence.sourceInteractionId,
			createdAt: factEvidence.createdAt,
			input: interactionTrace.inputRaw,
			stt: interactionTrace.sttResult,
			traceId: interactionTrace.id,
		})
		.from(factEvidence)
		.leftJoin(
			interactionTrace,
			eq(interactionTrace.id, factEvidence.sourceInteractionId),
		)
		.where(eq(factEvidence.factId, factId))
		.orderBy(desc(factEvidence.createdAt))
		.limit(EVIDENCE_LINK_LIMIT)

	return rows
		.filter((row) => row.interactionId != null)
		.map((row) => ({
			id: row.id,
			interactionId: row.interactionId as string,
			createdAt: row.createdAt,
			input: row.stt ?? row.input,
			mirrored: row.traceId != null,
		}))
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

export const getEpisodeDomiaOptions = async (): Promise<
	FilterFacetOption[]
> => {
	const rows = await db
		.selectDistinct({
			key: memoryEpisode.sourceDomiaKey,
			name: domiaRegistry.name,
		})
		.from(memoryEpisode)
		.leftJoin(
			domiaRegistry,
			eq(memoryEpisode.sourceDomiaKey, domiaRegistry.domiaKey),
		)

	return rows.map((r) => ({ label: r.name ?? r.key, value: r.key }))
}

export const getMemoryCounts = async (): Promise<MemoryCounts> => {
	const [facts] = await db
		.select({ value: count() })
		.from(memoryFact)
		.where(isNull(memoryFact.supersededAt))
	const [episodes] = await db.select({ value: count() }).from(memoryEpisode)
	const [userModels] = await db.select({ value: count() }).from(userModel)

	return {
		facts: facts?.value ?? 0,
		episodes: episodes?.value ?? 0,
		userModels: userModels?.value ?? 0,
	}
}
