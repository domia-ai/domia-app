import { createServerFn } from "@tanstack/react-start"
import {
	deleteIdentityData,
	getDomia,
	getDomiaPerformance,
	getRecentInteractions,
	resetConversation,
} from "@/services/domia"
import { identityDataInputSchema, idSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const getDomiaFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getDomia(data))

export const getRecentInteractionsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getRecentInteractions(data))

export const getDomiaPerformanceFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getDomiaPerformance(data))

export const deleteIdentityDataFn = createServerFn({ method: "POST" })
	.validator(identityDataInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return deleteIdentityData(data.domiaKey)
	})

export const resetConversationFn = createServerFn({ method: "POST" })
	.validator(idSchema)
	.handler(({ data }) => {
		assertWritable()
		return resetConversation(data)
	})
