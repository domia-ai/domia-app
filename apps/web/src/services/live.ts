import { listNodes } from "@/services/nodes"
import { nodePresence } from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { LiveNode } from "@/types/live"
import type { PresenceEntry } from "@/types/rooms"

const idleEntry = (domiaKey: string): PresenceEntry => ({
	domiaKey,
	status: "idle",
	lastActiveAt: null,
	satellites: [],
})

export const listLivePresence = async (): Promise<ActionResult<LiveNode[]>> => {
	try {
		const nodes = await listNodes()
		const results = await Promise.all(
			nodes.map(async (node): Promise<LiveNode | null> => {
				const hosted = node.identities.filter((i) => i.isHosted)
				if (!node.localIp || !node.httpPort || hosted.length === 0) return null
				const base = `http://${node.localIp}:${node.httpPort}`
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
			}),
		)
		return {
			ok: true,
			data: results.filter((n): n is LiveNode => n !== null),
		}
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error ? err.message : "Could not load live presence",
		}
	}
}
