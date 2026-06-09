import { and, eq, isNotNull, isNull, or, type SQL } from "drizzle-orm"
import { interactionLabel, interactionTrace } from "@domia-app/db"
import { FLOWS } from "@/constants/conversations"
import { buildFacetFilters } from "@/utils/table-builders"
import type { FacetMapEntry, TableFilters } from "@/types/table"

const flowSql = (value: string): SQL | undefined => {
	const conds = value
		.split(",")
		.filter(Boolean)
		.map((k) => FLOWS.find((f) => f.key === k))
		.filter((f): f is (typeof FLOWS)[number] => f != null)
		.map((f) =>
			and(
				eq(interactionTrace.inputType, f.inputType),
				eq(interactionTrace.responseType, f.responseType),
			),
		)
	return or(...conds)
}

const CONVERSATION_FACET_MAP: Record<string, FacetMapEntry> = {
	domia: { column: interactionTrace.sourceDomiaKey, op: "in" },
	flow: { build: flowSql },
	rating: {
		build: (v) =>
			v === "ungraded"
				? isNull(interactionLabel.id)
				: v === "up" || v === "down"
					? eq(interactionLabel.rating, v)
					: undefined,
	},
	tool: {
		build: (v) =>
			v === "1" ? isNotNull(interactionTrace.mcpServerUsed) : undefined,
	},
	error: {
		build: (v) =>
			v === "1" ? isNull(interactionTrace.llmResponse) : undefined,
	},
	from: { column: interactionTrace.createdAt, op: "gte" },
	to: { column: interactionTrace.createdAt, op: "lte" },
	latMin: { column: interactionTrace.totalMs, op: "gte", numeric: true },
	latMax: { column: interactionTrace.totalMs, op: "lte", numeric: true },
	llmModel: { column: interactionTrace.llmModelUsed, op: "in" },
	sttModel: { column: interactionTrace.sttModelUsed, op: "in" },
	ttsEngine: { column: interactionTrace.ttsEngineUsed, op: "in" },
	ttsVoice: { column: interactionTrace.ttsVoiceUsed, op: "in" },
}

export const buildConversationFilters = (filters: TableFilters): SQL[] =>
	buildFacetFilters(CONVERSATION_FACET_MAP, filters)
