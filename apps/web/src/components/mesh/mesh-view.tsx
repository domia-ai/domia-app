import { useQuery } from "@tanstack/react-query"
import { Workflow } from "lucide-react"
import { MeshNodeCard } from "./mesh-node-card"
import { DelegationEdges } from "./delegation-edges"
import { meshQueryOptions } from "@/server/mesh"

export function MeshView() {
	const { data, isLoading, isError } = useQuery(meshQueryOptions())

	if (isLoading)
		return <p className="text-muted-foreground text-sm">Loading…</p>
	if (isError || !data?.ok)
		return (
			<p className="text-destructive text-sm">
				{(data && !data.ok && data.error) || "Could not load topology."}
			</p>
		)

	const topology = data.data
	if (!topology || topology.nodes.length === 0)
		return (
			<div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center text-sm">
				<Workflow className="size-8 opacity-40" />
				<p>No nodes discovered yet.</p>
			</div>
		)

	const names = new Map<string, string>()
	for (const node of topology.nodes)
		for (const identity of node.identities)
			names.set(identity.domiaKey, identity.name)
	const nameOf = (key: string) => names.get(key) ?? key

	return (
		<div className="space-y-6">
			<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
				{topology.nodes.map((node) => (
					<MeshNodeCard key={node.nodeId} node={node} />
				))}
			</div>
			<DelegationEdges edges={topology.edges} nameOf={nameOf} />
		</div>
	)
}
