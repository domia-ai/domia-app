import { and, asc, avg, count, eq, isNotNull, isNull } from "drizzle-orm"
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

	const perceivedRows = await db
		.select({ v: interactionTrace.perceivedTtfaMs })
		.from(interactionTrace)
		.leftJoin(interactionLabel, label())
		.where(and(where, isNotNull(interactionTrace.perceivedTtfaMs)))
		.orderBy(asc(interactionTrace.perceivedTtfaMs))
	const perceivedValues = perceivedRows
		.map((r) => r.v)
		.filter((v): v is number => v !== null)
	const percentile = (p: number): number | null =>
		perceivedValues.length === 0
			? null
			: perceivedValues[
					Math.min(
						perceivedValues.length - 1,
						Math.floor(perceivedValues.length * p),
					)
				]

	const total = main?.total ?? 0
	return {
		total,
		avgMs: main?.avgMs ? Number(main.avgMs) : null,
		errorRate: total ? (errors?.c ?? 0) / total : 0,
		ungraded: ungraded?.c ?? 0,
		perceived: { p50: percentile(0.5), p95: percentile(0.95) },
		flows: [...flowCounts.entries()].map(([key, c]) => ({ key, count: c })),
	}
}
