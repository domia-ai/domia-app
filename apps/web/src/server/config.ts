import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	getConfig,
	getConfigHealth,
	importConfig,
	restartDomia,
} from "@/services/config"
import { idSchema, importConfigInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const getConfigFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getConfig(data))

export const getConfigHealthFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getConfigHealth(data))

export const importConfigFn = createServerFn({ method: "POST" })
	.validator(importConfigInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return importConfig(data)
	})

export const restartDomiaFn = createServerFn({ method: "POST" })
	.validator(idSchema)
	.handler(({ data }) => {
		assertWritable()
		return restartDomia(data)
	})

export const configQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["config", domiaKey],
		queryFn: () => getConfigFn({ data: domiaKey }),
	})

export const configHealthQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["config-health", domiaKey],
		queryFn: () => getConfigHealthFn({ data: domiaKey }),
	})
