import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getOverviewData, listMeshDomias } from "@/services/overview"

export const getOverviewDataFn = createServerFn({ method: "GET" }).handler(() =>
	getOverviewData(),
)

export const overviewQueryOptions = () =>
	queryOptions({
		queryKey: ["overview"],
		queryFn: () => getOverviewDataFn(),
	})

export const getMeshDomiasFn = createServerFn({ method: "GET" }).handler(() =>
	listMeshDomias(),
)
