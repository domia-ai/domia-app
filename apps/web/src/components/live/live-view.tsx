import { useQuery } from "@tanstack/react-query"
import { Radio } from "lucide-react"
import { NodeLivePanel } from "./node-live-panel"
import { livePresenceQueryOptions } from "@/server/live"

export function LiveView() {
	const { data, isLoading, isError } = useQuery(livePresenceQueryOptions())

	if (isLoading)
		return <p className="text-muted-foreground text-sm">Loading…</p>
	if (isError || !data?.ok)
		return (
			<p className="text-destructive text-sm">
				{(!isLoading && data && !data.ok && data.error) ||
					"Could not load live presence."}
			</p>
		)

	const nodes = data.data ?? []
	if (nodes.length === 0)
		return (
			<div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center text-sm">
				<Radio className="size-8 opacity-40" />
				<p>No reachable nodes. Connect a Domia to see live activity.</p>
			</div>
		)

	return (
		<div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
			{nodes.map((node) => (
				<NodeLivePanel key={node.nodeId} node={node} />
			))}
		</div>
	)
}
