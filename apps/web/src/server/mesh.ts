import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getMeshTopology } from "@/services/mesh"

export const meshTopologyFn = createServerFn({ method: "GET" }).handler(() =>
	getMeshTopology(),
)

export const meshQueryOptions = () =>
	queryOptions({
		queryKey: ["mesh-topology"],
		queryFn: () => meshTopologyFn(),
		refetchInterval: 5000,
	})
