import { nodePresence } from "@/lib/node-client"
import { nodeBaseUrl } from "@/utils/node-base"
import type { FleetPresence } from "@/types/fleet"
import type { LiveNode } from "@/types/live"
import type { NodeSummary } from "@/types/nodes"
import type { PresenceEntry, PresenceStatus } from "@/types/rooms"

const idleEntry = (domiaKey: string): PresenceEntry => ({
	domiaKey,
	status: "idle",
	lastActiveAt: null,
	satellites: [],
})

const isPollable = (node: NodeSummary) =>
	!!node.localIp && !!node.httpPort && node.identities.some((i) => i.isHosted)

const liveNodeFor = async (node: NodeSummary): Promise<LiveNode | null> => {
	const hosted = node.identities.filter((i) => i.isHosted)
	const base = nodeBaseUrl(node)
	try {
		const { presence } = await nodePresence(base)
		const byKey = new Map(presence.map((p) => [p.domiaKey, p]))
		const principal = hosted.find((i) => i.isPrincipal) ?? hosted[0]
		return {
			nodeId: node.nodeId,
			nodeName: node.principalName ?? base,
			hostDomiaKey: principal.domiaKey,
			rooms: hosted.map((i) => ({
				domiaKey: i.domiaKey,
				name: i.name,
				canIntercom: byKey.get(i.domiaKey)?.canIntercom ?? false,
				canBroadcast: byKey.get(i.domiaKey)?.canBroadcast ?? false,
			})),
			entries: hosted.map(
				(i) => byKey.get(i.domiaKey) ?? idleEntry(i.domiaKey),
			),
		}
	} catch {
		return null
	}
}

export const presenceForNodes = async (
	nodes: NodeSummary[],
): Promise<FleetPresence> => {
	const results = await Promise.all(nodes.filter(isPollable).map(liveNodeFor))
	const live = results.filter((n): n is LiveNode => n !== null)
	const statusByKey: Record<string, PresenceStatus> = {}
	for (const node of live)
		for (const entry of node.entries) statusByKey[entry.domiaKey] = entry.status
	return {
		nodes: live,
		statusByKey,
		status: live.length > 0 ? "ok" : "unavailable",
	}
}
