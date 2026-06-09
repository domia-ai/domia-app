import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { getAnalyticsFn } from "@/server/analytics"

export const Route = createFileRoute("/_dashboard/analytics")({
	head: () => ({ meta: [{ title: "Analytics | Domia Console" }] }),
	loader: () => getAnalyticsFn(),
	component: AnalyticsPage,
})

function AnalyticsPage() {
	const data = Route.useLoaderData()
	return (
		<div className="space-y-6">
			<PageHeader
				title="Analytics"
				description="Time to first audio, per-stage latency, model performance and the labeled eval corpus."
			/>
			<AnalyticsView data={data} />
		</div>
	)
}
