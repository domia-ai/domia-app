import { createFileRoute } from "@tanstack/react-router"
import { SatellitesView } from "@/components/satellites/satellites-view"
import { allSatellitesQueryOptions } from "@/server/satellites"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/satellites")({
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.nav_satellites() }) }],
	}),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(allSatellitesQueryOptions()),
	component: SatellitesView,
})
