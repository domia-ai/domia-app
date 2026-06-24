import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { FleetView } from "@/components/fleet/fleet-view"
import { fleetGraphQueryOptions } from "@/server/fleet"
import { validateTableSearch } from "@/utils/table-params"

export const Route = createFileRoute("/_dashboard/domias/")({
	validateSearch: validateTableSearch,
	head: () => ({ meta: [{ title: "Fleet | Domia Console" }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(fleetGraphQueryOptions()),
	component: DomiasPage,
})

function DomiasPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Fleet"
				description="Every Domia on this property — see them as cards, on the map, or in a table."
			/>
			<FleetView />
		</div>
	)
}
