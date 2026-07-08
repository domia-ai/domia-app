import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { OverviewView } from "@/components/overview/overview-view"
import { overviewQueryOptions } from "@/server/overview"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/")({
	head: () => ({ meta: [{ title: m.meta_title({ page: m.nav_overview() }) }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(overviewQueryOptions()),
	component: OverviewPage,
})

function OverviewPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title={m.nav_overview()}
				description={m.route_overview_description()}
			/>
			<OverviewView />
		</div>
	)
}
