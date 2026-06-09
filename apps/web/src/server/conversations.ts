import { createServerFn } from "@tanstack/react-start"
import {
	getInteraction,
	getSessionTurns,
	getSnapshotFacetOptions,
	listInteractions,
} from "@/services/conversations"
import { getConversationStats } from "@/services/conversation-stats"
import { idSchema, tableParamsSchema } from "@/schemas/server"

export const listInteractionsFn = createServerFn({ method: "GET" })
	.validator(tableParamsSchema)
	.handler(({ data }) => listInteractions(data))

export const getConversationStatsFn = createServerFn({ method: "GET" })
	.validator(tableParamsSchema)
	.handler(({ data }) => getConversationStats(data))

export const getSnapshotFacetOptionsFn = createServerFn({
	method: "GET",
}).handler(() => getSnapshotFacetOptions())

export const getInteractionFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getInteraction(data))

export const getSessionTurnsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getSessionTurns(data))
