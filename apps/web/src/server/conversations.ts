import { createServerFn } from "@tanstack/react-start"
import {
	getConversationFacets,
	getInteraction,
	getSessionTurns,
	listInteractions,
} from "@/services/conversations"
import { getConversationStats } from "@/services/conversation-stats"
import { getTurnEvents } from "@/services/turn-events"
import { idSchema, tableParamsSchema } from "@/schemas/server"

export const listInteractionsFn = createServerFn({ method: "GET" })
	.validator(tableParamsSchema)
	.handler(({ data }) => listInteractions(data))

export const getConversationStatsFn = createServerFn({ method: "GET" })
	.validator(tableParamsSchema)
	.handler(({ data }) => getConversationStats(data))

export const getConversationFacetsFn = createServerFn({
	method: "GET",
}).handler(() => getConversationFacets())

export const getInteractionFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getInteraction(data))

export const getSessionTurnsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getSessionTurns(data))

export const getTurnEventsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getTurnEvents(data))
