import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { BroadcastView } from "@/components/broadcast/broadcast-view"
import { livePresenceQueryOptions } from "@/server/live"

export const Route = createFileRoute("/_dashboard/broadcast/")({
	validateSearch: (search: Record<string, unknown>) => ({
		domia: typeof search.domia === "string" ? search.domia : undefined,
	}),
	head: () => ({ meta: [{ title: "Broadcast | Domia Console" }] }),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(livePresenceQueryOptions()),
	component: BroadcastPage,
})

function BroadcastPage() {
	const { domia } = Route.useSearch()
	return (
		<div className="space-y-6">
			<PageHeader
				title="Broadcast"
				description="Announce to your rooms or open an intercom between them."
			/>
			<BroadcastView initialTarget={domia} />
		</div>
	)
}
