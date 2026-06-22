import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { LiveView } from "@/components/live/live-view"
import { livePresenceQueryOptions } from "@/server/live"

export const Route = createFileRoute("/_dashboard/live/")({
	head: () => ({ meta: [{ title: "Live | Domia Console" }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(livePresenceQueryOptions()),
	component: LivePage,
})

function LivePage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Live"
				description="What's happening across your home right now — presence, announcements, and intercom."
			/>
			<LiveView />
		</div>
	)
}
