import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { BroadcastView } from "@/components/broadcast/broadcast-view"
import { livePresenceQueryOptions } from "@/server/live"

export const Route = createFileRoute("/_dashboard/broadcast/")({
	head: () => ({ meta: [{ title: "Broadcast | Domia Console" }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(livePresenceQueryOptions()),
	component: BroadcastPage,
})

function BroadcastPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Broadcast"
				description="Announce to your rooms or open an intercom between them."
			/>
			<BroadcastView />
		</div>
	)
}
