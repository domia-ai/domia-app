import { listDomiaTargets } from "@/services/fleet"
import { presenceForNodes } from "@/services/live"
import { listNodes } from "@/services/nodes"
import type { ActionResult } from "@/types"
import type { BroadcastTargets } from "@/types/broadcast"

export const getBroadcastTargets = async (): Promise<
	ActionResult<BroadcastTargets>
> => {
	try {
		const [domias, nodes] = await Promise.all([listDomiaTargets(), listNodes()])
		const presence = await presenceForNodes(nodes)
		const broadcastable = new Set(
			presence.nodes
				.flatMap((n) => n.rooms)
				.filter((r) => r.canBroadcast)
				.map((r) => r.domiaKey),
		)
		return {
			ok: true,
			data: {
				targets: domias.filter((d) => broadcastable.has(d.domiaKey)),
				intercomNodes: presence.nodes.filter(
					(n) => n.rooms.filter((r) => r.canIntercom).length > 1,
				),
				presence: presence.status,
				total: domias.length,
			},
		}
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error ? err.message : "Could not load broadcast targets",
		}
	}
}
