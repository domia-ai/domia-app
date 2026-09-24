import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getBroadcastTargets } from "@/services/broadcast"

export const broadcastTargetsFn = createServerFn({ method: "GET" }).handler(
	() => getBroadcastTargets(),
)

export const broadcastTargetsQueryOptions = () =>
	queryOptions({
		queryKey: ["broadcast-targets"],
		queryFn: () => broadcastTargetsFn(),
		refetchInterval: 3000,
	})
