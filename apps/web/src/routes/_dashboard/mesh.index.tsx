import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { MeshView } from "@/components/mesh/mesh-view"
import { meshQueryOptions } from "@/server/mesh"

export const Route = createFileRoute("/_dashboard/mesh/")({
	head: () => ({ meta: [{ title: "Mesh | Domia Console" }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(meshQueryOptions()),
	component: MeshPage,
})

function MeshPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Mesh"
				description="How work flows across your nodes — who hosts what, and who delegates to whom."
			/>
			<MeshView />
		</div>
	)
}
