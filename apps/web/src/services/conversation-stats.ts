import { and, avg, count, eq, isNull } from "drizzle-orm"
import { interactionLabel, interactionTrace } from "@domia-app/db"
import { db } from "@/db"
import { buildSearchWhere } from "@/utils/table-builders"
import { buildConversationFilters } from "@/utils/conversation-filters"
import { deriveFlow } from "@/utils/flow"
import type { TableParams } from "@/types/table"
import type { ConversationStats } from "@/types/conversations"

const SEARCH_COLUMNS = [
	interactionTrace.sttResult,
	interactionTrace.inputRaw,
	interactionTrace.llmResponse,
]

const label = () => eq(interactionLabel.interactionId, interactionTrace.id)

export const getConversationStats = async (
	params: TableParams,
): Promise<ConversationStats> => {
	const where = and(
		buildSearchWhere(SEARCH_COLUMNS, params.search),
		...buildConversationFilters(params.filters),
	)

	const [main] = await db
		.select({ total: count(), avgMs: avg(interactionTrace.totalMs) })
		.from(interactionTrace)
		.leftJoin(interactionLabel, label())
		.where(where)

	const [errors] = await db
		.select({ c: count() })
		.from(interactionTrace)
		.leftJoin(interactionLabel, label())
		.where(and(where, isNull(interactionTrace.llmResponse)))

	const [ungraded] = await db
		.select({ c: count() })
		.from(interactionTrace)
		.leftJoin(interactionLabel, label())
		.where(and(where, isNull(interactionLabel.id)))

	const flowRows = await db
		.select({
			inputType: interactionTrace.inputType,
			responseType: interactionTrace.responseType,
			c: count(),
		})
		.from(interactionTrace)
		.leftJoin(interactionLabel, label())
		.where(where)
		.groupBy(interactionTrace.inputType, interactionTrace.responseType)

	const flowCounts = new Map<
		ConversationStats["flows"][number]["key"],
		number
	>()
	for (const row of flowRows) {
		const key = deriveFlow(row.inputType, row.responseType)
		flowCounts.set(key, (flowCounts.get(key) ?? 0) + row.c)
	}

	const total = main?.total ?? 0
	return {
		total,
		avgMs: main?.avgMs ? Number(main.avgMs) : null,
		errorRate: total ? (errors?.c ?? 0) / total : 0,
		ungraded: ungraded?.c ?? 0,
		flows: [...flowCounts.entries()].map(([key, c]) => ({ key, count: c })),
	}
}
