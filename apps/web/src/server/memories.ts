import { createServerFn } from "@tanstack/react-start"
import {
	getFactCount,
	getFactDomiaOptions,
	listFacts,
} from "@/services/memories"
import { tableParamsSchema } from "@/schemas/server"

export const listFactsFn = createServerFn({ method: "GET" })
	.validator(tableParamsSchema)
	.handler(({ data }) => listFacts(data))

export const getFactDomiaOptionsFn = createServerFn({ method: "GET" }).handler(
	() => getFactDomiaOptions(),
)

export const getFactCountFn = createServerFn({ method: "GET" }).handler(() =>
	getFactCount(),
)
