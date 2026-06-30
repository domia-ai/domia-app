import { createFileRoute } from "@tanstack/react-router"
import { SatellitesView } from "@/components/satellites/satellites-view"
import { allSatellitesQueryOptions } from "@/server/satellites"

export const Route = createFileRoute("/_dashboard/satellites")({
	head: () => ({ meta: [{ title: "Satellites | Domia Console" }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(allSatellitesQueryOptions()),
	component: SatellitesView,
})
