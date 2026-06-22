import { domiaRegistry } from "@domia-app/db"
import { db } from "@/db"
import { isOnline } from "@/utils/presence"
import { resolveNodeBase } from "@/services/fleet"
import {
	nodeListIdentities,
	nodeCreateIdentity,
	nodeRemoveIdentity,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	IdentityRole,
	NodeIdentity,
	NodeIdentitySummary,
	NodeSummary,
	NodeDetail,
} from "@/types/nodes"

const nodeIdOf = (localIp: string, httpPort: number): string =>
	`${localIp}-${httpPort}`

const roleOf = (isHosted: boolean, isPrincipal: boolean): IdentityRole =>
	isPrincipal ? "principal" : isHosted ? "hosted" : "peer"

const buildNodes = async (): Promise<NodeSummary[]> => {
	const rows = await db
		.select({
			domiaKey: domiaRegistry.domiaKey,
			name: domiaRegistry.name,
			avatarId: domiaRegistry.avatarId,
			nodeId: domiaRegistry.nodeId,
			localIp: domiaRegistry.localIp,
			httpPort: domiaRegistry.httpPort,
			isActive: domiaRegistry.isActive,
			isHosted: domiaRegistry.isHosted,
			isPrincipal: domiaRegistry.isPrincipal,
			lastSeenAt: domiaRegistry.lastSeenAt,
		})
		.from(domiaRegistry)

	const groups = new Map<string, NodeIdentitySummary[]>()
	const addr = new Map<string, { localIp: string; httpPort: number }>()
	for (const r of rows) {
		if (!r.isActive) continue
		if (!r.localIp || !r.httpPort) continue
		const nodeId = r.nodeId ?? nodeIdOf(r.localIp, r.httpPort)
		addr.set(nodeId, { localIp: r.localIp, httpPort: r.httpPort })
		const list = groups.get(nodeId) ?? []
		list.push({
			domiaKey: r.domiaKey,
			name: r.name,
			avatarId: r.avatarId,
			isHosted: r.isHosted,
			isPrincipal: r.isPrincipal,
			role: roleOf(r.isHosted, r.isPrincipal),
			online: isOnline(r.lastSeenAt),
			lastSeenAt: r.lastSeenAt,
		})
		groups.set(nodeId, list)
	}

	return [...groups.entries()].map(([nodeId, identities]) => {
		const { localIp, httpPort } = addr.get(nodeId)!
		const hosted = identities.filter((i) => i.isHosted)
		const peers = identities.filter((i) => !i.isHosted)
		const principal = identities.find((i) => i.isPrincipal)
		return {
			nodeId,
			localIp,
			httpPort,
			online: identities.some((i) => i.online),
			hostedCount: hosted.length,
			peerCount: peers.length,
			principalName: principal?.name ?? null,
			identities,
		}
	})
}

export const listNodes = async (): Promise<NodeSummary[]> => buildNodes()

export const getNode = async (nodeId: string): Promise<NodeDetail | null> => {
	const node = (await buildNodes()).find((n) => n.nodeId === nodeId)
	if (!node) return null
	return {
		...node,
		hosted: node.identities.filter((i) => i.isHosted),
		peers: node.identities.filter((i) => !i.isHosted),
	}
}

export const listIdentities = async (
	anchorDomiaKey: string,
): Promise<ActionResult<NodeIdentity[]>> => {
	const base = await resolveNodeBase(anchorDomiaKey)
	if (!base.ok) return base
	try {
		const { identities } = await nodeListIdentities(base.data)
		return { ok: true, data: identities }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not list identities",
		}
	}
}

export const createIdentity = async (input: {
	anchorDomiaKey: string
	name: string
}): Promise<ActionResult<NodeIdentity>> => {
	const base = await resolveNodeBase(input.anchorDomiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeCreateIdentity(base.data, { name: input.name })
		return {
			ok: true,
			data: {
				domiaKey: result.identity.domiaKey,
				name: result.identity.name,
				isHosted: true,
				isPrincipal: false,
				role: "hosted",
			},
		}
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not create identity",
		}
	}
}

export const removeIdentity = async (input: {
	anchorDomiaKey: string
	domiaKey: string
}): Promise<ActionResult<boolean>> => {
	const base = await resolveNodeBase(input.anchorDomiaKey)
	if (!base.ok) return base
	try {
		const { removed } = await nodeRemoveIdentity(base.data, input.domiaKey)
		return { ok: true, data: removed }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not remove identity",
		}
	}
}
