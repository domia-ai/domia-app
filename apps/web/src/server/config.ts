import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	getConfig,
	getConfigHealth,
	getConfigSchema,
	importConfig,
	restartDomia,
} from "@/services/config"
import {
	configSchemaInputSchema,
	idSchema,
	importConfigInputSchema,
} from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const getConfigFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getConfig(data))

export const getConfigSchemaFn = createServerFn({ method: "GET" })
	.validator(configSchemaInputSchema)
	.handler(({ data }) => getConfigSchema(data))

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

export const configSchemaQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["config-schema", domiaKey],
		queryFn: () => getConfigSchemaFn({ data: domiaKey }),
		staleTime: 5 * 60 * 1000,
	})

export const configHealthQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["config-health", domiaKey],
		queryFn: () => getConfigHealthFn({ data: domiaKey }),
	})
