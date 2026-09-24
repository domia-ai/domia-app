import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getInteractionLadder, getLatencyStats } from "@/services/latency"
import { idSchema, interactionLadderInputSchema } from "@/schemas/server"
import { LATENCY_REFETCH_MS } from "@/constants/latency"

export const getLatencyStatsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getLatencyStats(data))

export const getInteractionLadderFn = createServerFn({ method: "GET" })
	.validator(interactionLadderInputSchema)
	.handler(({ data }) => getInteractionLadder(data))

export const latencyStatsQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["latency-stats", domiaKey],
		queryFn: () => getLatencyStatsFn({ data: domiaKey }),
		refetchInterval: LATENCY_REFETCH_MS,
	})

export const interactionLadderQueryOptions = (
	domiaKey: string,
	interactionId: string,
) =>
	queryOptions({
		queryKey: ["interaction-ladder", domiaKey, interactionId],
		queryFn: () =>
			getInteractionLadderFn({ data: { domiaKey, interactionId } }),
		retry: false,
		staleTime: LATENCY_REFETCH_MS,
	})
