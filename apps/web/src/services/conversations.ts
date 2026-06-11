import {
	and,
	asc,
	count,
	desc,
	eq,
	getTableColumns,
	isNotNull,
} from "drizzle-orm"
import type { SQLiteColumn } from "drizzle-orm/sqlite-core"
import {
	audioAsset,
	domiaRegistry,
	interactionLabel,
	interactionSessionTrace,
	interactionTrace,
	memoryFact,
} from "@domia-app/db"
import { db } from "@/db"
import { buildOrderBy, buildSearchWhere } from "@/utils/table-builders"
import { buildConversationFilters } from "@/utils/conversation-filters"
import { deriveFlow } from "@/utils/flow"
import { CONVERSATION_EXPORT_MAX } from "@/constants/conversations"
import type { FilterFacetOption, Paginated, TableParams } from "@/types/table"
import type {
	ConversationExportRow,
	ConversationRow,
	InteractionDetail,
	SessionDetail,
	SnapshotFacetOptions,
	ConversationFacets,
} from "@/types/conversations"

const SEARCH_COLUMNS = [
	interactionTrace.sttResult,
	interactionTrace.inputRaw,
	interactionTrace.llmResponse,
]

const SORTABLE = {
	createdAt: interactionTrace.createdAt,
	latency: interactionTrace.totalMs,
}

export const listInteractions = async (
	params: TableParams,
): Promise<Paginated<ConversationRow>> => {
	const where = and(
		buildSearchWhere(SEARCH_COLUMNS, params.search),
		...buildConversationFilters(params.filters),
	)
	const orderBy = buildOrderBy(
		SORTABLE,
		params.sort,
		desc(interactionTrace.createdAt),
	)

	const rows = await db
		.select({
			...getTableColumns(interactionTrace),
			domiaName: domiaRegistry.name,
			domiaAvatarId: domiaRegistry.avatarId,
			rating: interactionLabel.rating,
			tags: interactionLabel.tags,
			correction: interactionLabel.correction,
		})
		.from(interactionTrace)
		.leftJoin(
			domiaRegistry,
			eq(interactionTrace.sourceDomiaKey, domiaRegistry.domiaKey),
		)
		.leftJoin(
			interactionLabel,
			eq(interactionLabel.interactionId, interactionTrace.id),
		)
		.where(where)
		.orderBy(...orderBy)
		.limit(params.pageSize)
		.offset(params.page * params.pageSize)

	const [totals] = await db
		.select({ value: count() })
		.from(interactionTrace)
		.leftJoin(
			interactionLabel,
			eq(interactionLabel.interactionId, interactionTrace.id),
		)
		.where(where)

	return { rows: rows as ConversationRow[], total: totals?.value ?? 0 }
}

export const getInteraction = async (
	id: string,
): Promise<InteractionDetail | null> => {
	const [trace] = await db
		.select()
		.from(interactionTrace)
		.where(eq(interactionTrace.id, id))
		.limit(1)
	if (!trace) return null

	const [domia] = await db
		.select({ name: domiaRegistry.name, avatarId: domiaRegistry.avatarId })
		.from(domiaRegistry)
		.where(eq(domiaRegistry.domiaKey, trace.sourceDomiaKey))
		.limit(1)
	const [label] = await db
		.select()
		.from(interactionLabel)
		.where(eq(interactionLabel.interactionId, id))
		.limit(1)
	const audios = await db
		.select()
		.from(audioAsset)
		.where(eq(audioAsset.interactionId, id))

	const memoryFacts = await db
		.select()
		.from(memoryFact)
		.where(eq(memoryFact.sourceInteractionId, id))

	let adjacent: InteractionDetail["adjacent"] = null
	if (trace.interactionSessionTraceId) {
		const turns = await db
			.select({ id: interactionTrace.id })
			.from(interactionTrace)
			.where(
				eq(
					interactionTrace.interactionSessionTraceId,
					trace.interactionSessionTraceId,
				),
			)
			.orderBy(asc(interactionTrace.createdAt))
		const index = turns.findIndex((t) => t.id === id)
		if (index >= 0)
			adjacent = {
				prevId: index > 0 ? turns[index - 1].id : null,
				nextId: index < turns.length - 1 ? turns[index + 1].id : null,
				index,
				total: turns.length,
			}
	}

	return {
		trace,
		domiaName: domia?.name ?? null,
		domiaAvatarId: domia?.avatarId ?? null,
		label: label ?? null,
		inputAudio: audios.find((a) => a.kind === "input") ?? null,
		ttsAudio: audios.find((a) => a.kind === "tts") ?? null,
		memoryFacts,
		adjacent,
	}
}

export const getSessionTurns = async (
	sessionId: string,
): Promise<SessionDetail | null> => {
	const [session] = await db
		.select()
		.from(interactionSessionTrace)
		.where(eq(interactionSessionTrace.id, sessionId))
		.limit(1)
	if (!session) return null

	const [domia] = await db
		.select({ name: domiaRegistry.name, avatarId: domiaRegistry.avatarId })
		.from(domiaRegistry)
		.where(eq(domiaRegistry.domiaKey, session.sourceDomiaKey))
		.limit(1)
	const turns = await db
		.select()
		.from(interactionTrace)
		.where(eq(interactionTrace.interactionSessionTraceId, sessionId))
		.orderBy(interactionTrace.createdAt)

	return {
		session,
		domiaName: domia?.name ?? null,
		domiaAvatarId: domia?.avatarId ?? null,
		turns,
	}
}

export const exportInteractions = async (
	params: TableParams,
): Promise<ConversationExportRow[]> => {
	const where = and(
		buildSearchWhere(SEARCH_COLUMNS, params.search),
		...buildConversationFilters(params.filters),
	)
	const rows = await db
		.select({
			id: interactionTrace.id,
			createdAt: interactionTrace.createdAt,
			inputType: interactionTrace.inputType,
			responseType: interactionTrace.responseType,
			domiaName: domiaRegistry.name,
			sourceDomiaKey: interactionTrace.sourceDomiaKey,
			input: interactionTrace.sttResult,
			inputRaw: interactionTrace.inputRaw,
			response: interactionTrace.llmResponse,
			llmModel: interactionTrace.llmModelUsed,
			ttsVoice: interactionTrace.ttsVoiceUsed,
			totalMs: interactionTrace.totalMs,
			rating: interactionLabel.rating,
			correction: interactionLabel.correction,
			tags: interactionLabel.tags,
		})
		.from(interactionTrace)
		.leftJoin(
			domiaRegistry,
			eq(interactionTrace.sourceDomiaKey, domiaRegistry.domiaKey),
		)
		.leftJoin(
			interactionLabel,
			eq(interactionLabel.interactionId, interactionTrace.id),
		)
		.where(where)
		.orderBy(desc(interactionTrace.createdAt))
		.limit(CONVERSATION_EXPORT_MAX)

	return rows.map((r) => ({
		id: r.id,
		createdAt: r.createdAt,
		domia: r.domiaName ?? r.sourceDomiaKey,
		flow: deriveFlow(r.inputType, r.responseType),
		input: r.input ?? r.inputRaw,
		response: r.response,
		llmModel: r.llmModel,
		ttsVoice: r.ttsVoice,
		totalMs: r.totalMs,
		rating: r.rating,
		correction: r.correction,
		tags: r.tags as string[] | null,
	}))
}

const distinctOptions = async (
	column: SQLiteColumn,
): Promise<FilterFacetOption[]> => {
	const rows = await db
		.selectDistinct({ value: column })
		.from(interactionTrace)
		.where(isNotNull(column))
		.orderBy(asc(column))
	return rows
		.map((r) => r.value as string | null)
		.filter((v): v is string => typeof v === "string" && v.length > 0)
		.map((v) => ({ label: v, value: v }))
}

export const getSnapshotFacetOptions =
	async (): Promise<SnapshotFacetOptions> => {
		const [llmModel, sttModel, ttsEngine, ttsVoice] = await Promise.all([
			distinctOptions(interactionTrace.llmModelUsed),
			distinctOptions(interactionTrace.sttModelUsed),
			distinctOptions(interactionTrace.ttsEngineUsed),
			distinctOptions(interactionTrace.ttsVoiceUsed),
		])
		return { llmModel, sttModel, ttsEngine, ttsVoice }
	}

export const getConversationFacets = async (): Promise<ConversationFacets> => {
	const [snapshot, domias] = await Promise.all([
		getSnapshotFacetOptions(),
		db
			.select({ domiaKey: domiaRegistry.domiaKey, name: domiaRegistry.name })
			.from(domiaRegistry)
			.orderBy(asc(domiaRegistry.name)),
	])
	const domiaOptions: FilterFacetOption[] = domias.map((d) => ({
		label: d.name ?? d.domiaKey,
		value: d.domiaKey,
	}))
	return { ...snapshot, domiaOptions }
}
