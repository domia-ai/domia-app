import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { listLivePresence } from "@/services/live"

export const livePresenceFn = createServerFn({ method: "GET" }).handler(() =>
	listLivePresence(),
)

export const livePresenceQueryOptions = () =>
	queryOptions({
		queryKey: ["live-presence"],
		queryFn: () => livePresenceFn(),
		refetchInterval: 3000,
	})
