import dbAdapter from "@/db/adapter"
import { registryLogger } from "@/utils"
import type { DomiaSnapshot } from "@/types"

const RUNTIME_FIELDS: ReadonlySet<string> = new Set([
	"nodeId",
	"localIp",
	"grpcPort",
	"httpPort",
	"isHosted",
	"isPrincipal",
	"lastInteractionAt",
])

const normalizeConfig = (snapshot: DomiaSnapshot): string => {
	const config: Record<string, unknown> = Object.fromEntries(
		Object.entries(snapshot).filter(([key]) => !RUNTIME_FIELDS.has(key)),
	)
	if (Array.isArray(config.skillProviders))
		config.skillProviders = config.skillProviders.map((p) => {
			const sp = (p ?? {}) as { auth?: { kind?: string } | null }
			return { ...sp, auth: sp.auth?.kind ? { kind: sp.auth.kind } : null }
		})
	return JSON.stringify(config)
}

export const upsertHeartbeat = (snapshot: DomiaSnapshot) => {
	const now = Date.now()
	const configSnapshotJson = normalizeConfig(snapshot)
	const configChanged =
		dbAdapter.readRegistryConfig(snapshot.domiaKey) !== configSnapshotJson

	const liveness = {
		id: snapshot.id ?? null,
		name: snapshot.name,
		nodeId: snapshot.nodeId ?? null,
		isActive: snapshot.isActive ?? true,
		localIp: snapshot.localIp ?? null,
		grpcPort: snapshot.grpcPort ?? null,
		httpPort: snapshot.httpPort ?? null,
		isHosted: snapshot.isHosted ?? true,
		isPrincipal: snapshot.isPrincipal ?? false,
		lastSeenAt: now,
	}

	dbAdapter.upsertRegistry(
		{
			domiaKey: snapshot.domiaKey,
			firstSeenAt: now,
			configSnapshotJson,
			updatedAt: now,
			...liveness,
		},
		configChanged
			? { ...liveness, configSnapshotJson, updatedAt: now }
			: liveness,
	)

	if (configChanged) {
		registryLogger.debug(`config changed for ${snapshot.domiaKey}`)
	}
}
