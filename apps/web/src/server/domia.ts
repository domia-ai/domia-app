import { createServerFn } from "@tanstack/react-start"
import {
	getDomia,
	getDomiaPerformance,
	getRecentInteractions,
} from "@/services/domia"
import { idSchema } from "@/schemas/server"

export const getDomiaFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getDomia(data))

export const getRecentInteractionsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getRecentInteractions(data))

export const getDomiaPerformanceFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getDomiaPerformance(data))
