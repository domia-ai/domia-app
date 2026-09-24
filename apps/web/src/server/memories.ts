import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	getEpisodeDomiaOptions,
	getFactDomiaOptions,
	getMemoryCounts,
	listEpisodes,
	listFactEvidence,
	listFacts,
	listUserModels,
} from "@/services/memories"
import { idSchema, tableParamsSchema } from "@/schemas/server"

export const listFactsFn = createServerFn({ method: "GET" })
	.validator(tableParamsSchema)
	.handler(({ data }) => listFacts(data))

export const listEpisodesFn = createServerFn({ method: "GET" })
	.validator(tableParamsSchema)
	.handler(({ data }) => listEpisodes(data))

export const listUserModelsFn = createServerFn({ method: "GET" }).handler(() =>
	listUserModels(),
)

export const listFactEvidenceFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => listFactEvidence(data))

export const getFactDomiaOptionsFn = createServerFn({ method: "GET" }).handler(
	() => getFactDomiaOptions(),
)

export const getEpisodeDomiaOptionsFn = createServerFn({
	method: "GET",
}).handler(() => getEpisodeDomiaOptions())

export const getMemoryCountsFn = createServerFn({ method: "GET" }).handler(() =>
	getMemoryCounts(),
)

export const factEvidenceQueryOptions = (factId: string) =>
	queryOptions({
		queryKey: ["fact-evidence", factId],
		queryFn: () => listFactEvidenceFn({ data: factId }),
	})
