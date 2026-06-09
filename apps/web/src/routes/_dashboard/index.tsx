import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { OverviewView } from "@/components/overview/overview-view"
import { overviewQueryOptions } from "@/server/overview"

export const Route = createFileRoute("/_dashboard/")({
	head: () => ({ meta: [{ title: "Overview | Domia Console" }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(overviewQueryOptions()),
	component: OverviewPage,
})

function OverviewPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Overview"
				description="Your local Domia mesh at a glance."
			/>
			<OverviewView />
		</div>
	)
}
