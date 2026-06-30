import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { recentAnnouncements } from "@/services/announcements"

export const recentAnnouncementsFn = createServerFn({ method: "GET" }).handler(
	() => recentAnnouncements(),
)

export const recentAnnouncementsQueryOptions = () =>
	queryOptions({
		queryKey: ["recent-announcements"],
		queryFn: () => recentAnnouncementsFn(),
		refetchInterval: 4000,
	})
