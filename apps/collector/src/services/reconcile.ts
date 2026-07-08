import dbAdapter from "@/db/adapter"
import { identitiesResponseSchema } from "@/schemas"
import { meshHeaders, registryLogger } from "@/utils"

type NodeGroup = { localIp: string; httpPort: number; keys: string[] }

export const reconcileRosters = async (): Promise<void> => {
	const rows = dbAdapter.getActiveMirrorIdentities()
	const byNode = new Map<string, NodeGroup>()
	for (const r of rows) {
		if (!r.nodeId || !r.localIp || !r.httpPort) continue
		const group = byNode.get(r.nodeId) ?? {
			localIp: r.localIp,
			httpPort: r.httpPort,
			keys: [],
		}
		group.keys.push(r.domiaKey)
		byNode.set(r.nodeId, group)
	}

	for (const [nodeId, node] of byNode) {
		try {
			const res = await fetch(
				`http://${node.localIp}:${node.httpPort}/identities`,
				{ headers: meshHeaders(), signal: AbortSignal.timeout(8_000) },
			)
			if (!res.ok) continue
			const parsed = identitiesResponseSchema.safeParse(await res.json())
			if (!parsed.success) continue
			const live = parsed.data.identities.map((i) => i.domiaKey)
			if (live.length === 0) {
				registryLogger.warn(
					`reconcile: node ${nodeId} returned an empty roster — treating as unhealthy, retiring nothing`,
				)
				continue
			}
			const retired = node.keys.filter((k) => !live.includes(k))
			if (retired.length === 0) continue
			dbAdapter.retireMirrorIdentitiesByNode(nodeId, live)
			registryLogger.info(
				`reconcile: retired ${retired.length} stale identit${retired.length === 1 ? "y" : "ies"} on node ${nodeId}`,
				{ retired },
			)
		} catch {
			continue
		}
	}
}
