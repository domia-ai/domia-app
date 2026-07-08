import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { BroadcastView } from "@/components/broadcast/broadcast-view"
import { livePresenceQueryOptions } from "@/server/live"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/broadcast/")({
	validateSearch: (search: Record<string, unknown>) => ({
		domia: typeof search.domia === "string" ? search.domia : undefined,
	}),
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.nav_broadcast() }) }],
	}),
	loader: ({ context }) =>
		context.queryClient.ensureQueryData(livePresenceQueryOptions()),
	component: BroadcastPage,
})

function BroadcastPage() {
	const { domia } = Route.useSearch()
	return (
		<div className="space-y-6">
			<PageHeader
				title={m.nav_broadcast()}
				description={m.route_broadcast_description()}
			/>
			<BroadcastView initialTarget={domia} />
		</div>
	)
}
