import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { getAnalyticsFn } from "@/server/analytics"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/analytics")({
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.nav_analytics() }) }],
	}),
	loader: () => getAnalyticsFn(),
	component: AnalyticsPage,
})

function AnalyticsPage() {
	const data = Route.useLoaderData()
	return (
		<div className="space-y-6">
			<PageHeader
				title={m.nav_analytics()}
				description={m.route_analytics_description()}
			/>
			<AnalyticsView data={data} />
		</div>
	)
}
