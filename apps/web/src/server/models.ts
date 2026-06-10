import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getModels, getModelJob, installModel } from "@/services/models"
import {
	idSchema,
	installModelInputSchema,
	modelJobInputSchema,
} from "@/schemas/server"

export const getModelsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getModels(data))

export const installModelFn = createServerFn({ method: "POST" })
	.validator(installModelInputSchema)
	.handler(({ data }) => installModel(data))

export const getModelJobFn = createServerFn({ method: "GET" })
	.validator(modelJobInputSchema)
	.handler(({ data }) => getModelJob(data.domiaKey, data.jobId))

export const modelsQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["models", domiaKey],
		queryFn: () => getModelsFn({ data: domiaKey }),
	})
