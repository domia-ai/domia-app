import { eq, inArray } from "drizzle-orm"
import { domiaRegistry } from "@domia-app/db"
import { db } from "@/db"
import { env } from "@/config"
import { isOnline } from "@/utils/presence"
import { nodeFailure } from "@/utils/service-errors"
import { configSnapshotToStoredJson } from "@/utils/config"
import { resolveNodeBase } from "@/services/fleet"
import { asHttpScheme, nodeBaseUrl } from "@/utils/node-base"
import {
	nodeCreateIdentity,
	nodeRemoveIdentity,
	nodeGetConfig,
	nodeGetNodeConfig,
	nodeUpdateNodeConfig,
	nodeProbeHealth,
	nodeProbeIdentities,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	AddNodeResult,
	CreatedIdentity,
	CreateIdentityInput,
	IdentityRole,
	NodeConfigApplyResult,
	NodeConfigSnapshot,
	NodeConfigUpdateInput,
	NodeDetail,
	NodeEndpoint,
	NodeIdentitySummary,
	NodeProbeInput,
	NodeProbeResult,
	NodeSummary,
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
			httpScheme: domiaRegistry.httpScheme,
			isActive: domiaRegistry.isActive,
			isHosted: domiaRegistry.isHosted,
			isPrincipal: domiaRegistry.isPrincipal,
			lastSeenAt: domiaRegistry.lastSeenAt,
		})
		.from(domiaRegistry)

	const groups = new Map<
		string,
		{ endpoint: NodeEndpoint; identities: NodeIdentitySummary[] }
	>()
	for (const r of rows) {
		if (!r.isActive) continue
		if (!r.localIp || !r.httpPort) continue
		const nodeId = r.nodeId ?? nodeIdOf(r.localIp, r.httpPort)
		const endpoint: NodeEndpoint = {
			localIp: r.localIp,
			httpPort: r.httpPort,
			httpScheme: asHttpScheme(r.httpScheme),
		}
		const group = groups.get(nodeId) ?? { endpoint, identities: [] }
		group.endpoint = endpoint
		group.identities.push({
			domiaKey: r.domiaKey,
			name: r.name,
			avatarId: r.avatarId,
			isHosted: r.isHosted,
			isPrincipal: r.isPrincipal,
			role: roleOf(r.isHosted, r.isPrincipal),
			online: isOnline(r.lastSeenAt),
			lastSeenAt: r.lastSeenAt,
		})
		groups.set(nodeId, group)
	}

	return [...groups.entries()].map(([nodeId, { endpoint, identities }]) => {
		const hosted = identities.filter((i) => i.isHosted)
		const peers = identities.filter((i) => !i.isHosted)
		const principal = identities.find((i) => i.isPrincipal)
		return {
			nodeId,
			localIp: endpoint.localIp,
			httpPort: endpoint.httpPort,
			httpScheme: endpoint.httpScheme,
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

export const createIdentity = async (
	input: CreateIdentityInput,
): Promise<ActionResult<CreatedIdentity>> => {
	const base = await resolveNodeBase(input.anchorDomiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeCreateIdentity(base.data, {
			name: input.name,
			...(input.domiaKey ? { domiaKey: input.domiaKey } : {}),
		})
		return {
			ok: true,
			data: {
				domiaKey: result.identity.domiaKey,
				name: result.identity.name,
				isHosted: true,
				isPrincipal: false,
				role: "hosted",
				restored: result.restored === true,
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

export const getNodeConfig = async (
	anchorDomiaKey: string,
): Promise<ActionResult<NodeConfigSnapshot>> => {
	const base = await resolveNodeBase(anchorDomiaKey)
	if (!base.ok) return base
	try {
		return { ok: true, data: await nodeGetNodeConfig(base.data) }
	} catch (err) {
		return nodeFailure(err, "Could not read the node config")
	}
}

export const updateNodeConfig = async (
	input: NodeConfigUpdateInput,
): Promise<ActionResult<NodeConfigApplyResult>> => {
	const base = await resolveNodeBase(input.anchorDomiaKey)
	if (!base.ok) return base
	try {
		return { ok: true, data: await nodeUpdateNodeConfig(base.data, input.node) }
	} catch (err) {
		return nodeFailure(err, "Could not apply the node config")
	}
}

const probeErrorMessage = (err: unknown): string => {
	if (err instanceof Error) {
		if (err.name === "TimeoutError" || err.name === "AbortError")
			return "Node timed out"
		if (err.message === "Node rejected the mesh secret") return err.message
		if (err.message.startsWith("/")) return err.message
	}
	return "Node unreachable"
}

const endpointOf = (input: NodeProbeInput): NodeEndpoint => ({
	localIp: input.host.trim(),
	httpPort: input.port,
	httpScheme: input.scheme,
})

export const probeNode = async (
	input: NodeProbeInput,
): Promise<ActionResult<NodeProbeResult>> => {
	const base = nodeBaseUrl(endpointOf(input))
	const timeoutMs = env.DOMIA_NODE_PROBE_TIMEOUT_MS
	try {
		const health = await nodeProbeHealth(base, timeoutMs)
		const { identities } = await nodeProbeIdentities(base, timeoutMs)
		if (identities.length === 0)
			return { ok: false, error: "Node reported no identities" }
		return {
			ok: true,
			data: {
				host: input.host.trim(),
				port: input.port,
				scheme: input.scheme,
				health,
				identities,
			},
		}
	} catch (err) {
		return { ok: false, error: probeErrorMessage(err) }
	}
}

export const addNodeByAddress = async (
	input: NodeProbeInput,
): Promise<ActionResult<AddNodeResult>> => {
	const probe = await probeNode(input)
	if (!probe.ok) return probe
	if (!probe.data) return { ok: false, error: "Node probe returned no data" }
	const { host, port, scheme } = probe.data
	const hosted = probe.data.identities.filter((i) => i.isHosted)
	if (hosted.length === 0)
		return { ok: false, error: "Node reported no identities" }
	const hostedKeys = hosted.map((i) => i.domiaKey)
	const now = Date.now()
	const syntheticNodeId = nodeIdOf(host, port)
	const known = await db
		.select({ nodeId: domiaRegistry.nodeId })
		.from(domiaRegistry)
		.where(inArray(domiaRegistry.domiaKey, hostedKeys))
	const nodeId =
		known.find((r) => r.nodeId && r.nodeId !== syntheticNodeId)?.nodeId ??
		syntheticNodeId
	const onNode = await db
		.select({ domiaKey: domiaRegistry.domiaKey })
		.from(domiaRegistry)
		.where(eq(domiaRegistry.nodeId, nodeId))
	const stale = onNode.filter((r) => !hostedKeys.includes(r.domiaKey))

	const base = nodeBaseUrl({
		localIp: host,
		httpPort: port,
		httpScheme: scheme,
	})
	const configByKey = new Map<string, string>()
	for (const identity of hosted) {
		try {
			const { config } = await nodeGetConfig(
				base,
				identity.domiaKey,
				env.DOMIA_NODE_PROBE_TIMEOUT_MS,
			)
			configByKey.set(
				identity.domiaKey,
				configSnapshotToStoredJson(config, identity.name, identity.domiaKey),
			)
		} catch {
			continue
		}
	}

	db.transaction((tx) => {
		for (const identity of hosted) {
			const configSnapshotJson = configByKey.get(identity.domiaKey)
			const liveness = {
				name: identity.name,
				nodeId,
				isActive: true,
				localIp: host,
				httpPort: port,
				httpScheme: scheme,
				isHosted: identity.isHosted,
				isPrincipal: identity.isPrincipal,
				lastSeenAt: now,
				updatedAt: now,
				...(configSnapshotJson != null ? { configSnapshotJson } : {}),
			}
			tx.insert(domiaRegistry)
				.values({ domiaKey: identity.domiaKey, firstSeenAt: now, ...liveness })
				.onConflictDoUpdate({ target: domiaRegistry.domiaKey, set: liveness })
				.run()
		}
		for (const row of stale)
			tx.update(domiaRegistry)
				.set({ isActive: false, updatedAt: now })
				.where(eq(domiaRegistry.domiaKey, row.domiaKey))
				.run()
	})

	const principal = hosted.find((i) => i.isPrincipal) ?? hosted[0]
	return {
		ok: true,
		data: { nodeId, domiaKey: principal.domiaKey, identities: hosted },
	}
}
