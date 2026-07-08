import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { FleetView } from "@/components/fleet/fleet-view"
import { fleetGraphQueryOptions } from "@/server/fleet"
import { validateTableSearch } from "@/utils/table-params"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/domias/")({
	validateSearch: validateTableSearch,
	head: () => ({ meta: [{ title: m.meta_title({ page: m.nav_fleet() }) }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(fleetGraphQueryOptions()),
	component: DomiasPage,
})

function DomiasPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title={m.nav_fleet()}
				description={m.route_fleet_description()}
			/>
			<FleetView />
		</div>
	)
}
