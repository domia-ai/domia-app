import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { EmotionsView } from "@/components/emotions/emotions-view"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/emotions")({
	head: () => ({ meta: [{ title: m.meta_title({ page: m.nav_emotions() }) }] }),
	component: EmotionsPage,
})

function EmotionsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title={m.nav_emotions()}
				description={m.route_emotions_description()}
			/>
			<EmotionsView />
		</div>
	)
}
