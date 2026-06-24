import { getMeshTopology } from "@/services/mesh"
import { getFleetTelemetry } from "@/services/fleet"
import { listNodes } from "@/services/nodes"
import type { ActionResult } from "@/types"
import type {
	FleetGraph,
	FleetGraphIdentity,
	FleetGraphNode,
} from "@/types/fleet"
import type { NodeIdentitySummary, NodeSummary } from "@/types/nodes"

export const getFleetGraph = async (): Promise<ActionResult<FleetGraph>> => {
	try {
		const [topo, nodes, telemetry] = await Promise.all([
			getMeshTopology(),
			listNodes(),
			getFleetTelemetry(),
		])
		if (!topo.ok) return topo
		const topology = topo.data ?? { nodes: [], edges: [] }

		const nodeById = new Map<string, NodeSummary>(
			nodes.map((n) => [n.nodeId, n]),
		)
		const metaByKey = new Map<string, NodeIdentitySummary>()
		for (const n of nodes)
			for (const id of n.identities) metaByKey.set(id.domiaKey, id)

		const graphNodes: FleetGraphNode[] = topology.nodes.map((node) => {
			const node$ = nodeById.get(node.nodeId)
			const identities: FleetGraphIdentity[] = node.identities.map((id) => {
				const meta = metaByKey.get(id.domiaKey)
				const tel = telemetry[id.domiaKey]
				return {
					domiaKey: id.domiaKey,
					name: id.name,
					avatarId: meta?.avatarId ?? null,
					isPrincipal: id.isPrincipal,
					role: tel?.role ?? "standalone",
					caps: id.caps,
					online: meta?.online ?? false,
					count: tel?.count ?? 0,
					ttfaP50: tel?.ttfaP50 ?? null,
				}
			})
			return {
				nodeId: node.nodeId,
				name: node.nodeName,
				localIp: node$?.localIp ?? "",
				httpPort: node$?.httpPort ?? 0,
				online: node$?.online ?? false,
				identities,
			}
		})

		return { ok: true, data: { nodes: graphNodes, edges: topology.edges } }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not load fleet graph",
		}
	}
}
