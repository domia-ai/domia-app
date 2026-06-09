import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { ComingSoon } from "@/components/shell/coming-soon"

export const Route = createFileRoute("/_dashboard/memories")({
	head: () => ({ meta: [{ title: "Memories | Domia Console" }] }),
	component: MemoriesPage,
})

function MemoriesPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Memories"
				description="What each Domia — and the mesh — remembers about you."
			/>
			<ComingSoon />
		</div>
	)
}
