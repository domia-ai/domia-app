import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { FleetView } from "@/components/fleet/fleet-view"
import { validateTableSearch } from "@/utils/table-params"

export const Route = createFileRoute("/_dashboard/domias/")({
	validateSearch: validateTableSearch,
	head: () => ({ meta: [{ title: "Domias | Domia Console" }] }),
	component: DomiasPage,
})

function DomiasPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Domias"
				description="Every Domia the Console has discovered on this property."
			/>
			<FleetView />
		</div>
	)
}
