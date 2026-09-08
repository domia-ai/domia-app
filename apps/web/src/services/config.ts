import { eq } from "drizzle-orm"
import { domiaRegistry } from "@domia-app/db"
import { db } from "@/db"
import { env } from "@/config"
import { isOnline } from "@/utils/presence"
import { getNodeEndpoint } from "@/services/fleet"
import { getDomia } from "@/services/domia"
import { listNodes } from "@/services/nodes"
import { domiaConfigToSnapshot } from "@/utils/config"
import { DEFAULT_CONFIG_SNAPSHOT } from "@/constants/config-defaults"
import { CONFIG_SCHEMA_SNAPSHOT } from "@/constants/config-schema"
import {
	nodeGetConfig,
	nodeGetConfigSchema,
	nodeImportConfig,
	nodeGetConfigHealth,
	nodeRestart,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	ConfigSnapshot,
	ConfigFetchSource,
	ConfigImportResult,
	ConfigHealth,
	ConfigSchemaResult,
	ImportConfigInput,
} from "@/types/config"

const resolveBase = async (domiaKey: string): Promise<ActionResult<string>> => {
	const endpoint = await getNodeEndpoint(domiaKey)
	if (!endpoint)
		return { ok: false, error: "This Domia has no reachable address" }
	return { ok: true, data: `http://${endpoint.localIp}:${endpoint.httpPort}` }
}

const anyOnlineBase = async (): Promise<string | null> => {
	const node = (await listNodes()).find((n) => n.online)
	return node ? `http://${node.localIp}:${node.httpPort}` : null
}

const onlineBaseFor = async (domiaKey: string): Promise<string | null> => {
	if (domiaKey) {
		const [row] = await db
			.select({
				localIp: domiaRegistry.localIp,
				httpPort: domiaRegistry.httpPort,
				lastSeenAt: domiaRegistry.lastSeenAt,
			})
			.from(domiaRegistry)
			.where(eq(domiaRegistry.domiaKey, domiaKey))
			.limit(1)
		if (row?.localIp && row.httpPort && isOnline(row.lastSeenAt))
			return `http://${row.localIp}:${row.httpPort}`
	}
	return anyOnlineBase()
}

const snapshotFallback = async (
	domiaKey: string,
): Promise<
	(ActionResult<ConfigSnapshot> & { source: ConfigFetchSource }) | null
> => {
	const domia = await getDomia(domiaKey)
	if (!domia) return null
	return {
		ok: true,
		data: {
			...DEFAULT_CONFIG_SNAPSHOT,
			...domiaConfigToSnapshot(domia.config, domia.name),
		} as ConfigSnapshot,
		source: "snapshot",
	}
}

export const getConfig = async (
	domiaKey: string,
): Promise<ActionResult<ConfigSnapshot> & { source?: ConfigFetchSource }> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) {
		return (await snapshotFallback(domiaKey)) ?? base
	}
	try {
		const { config } = await nodeGetConfig(base.data!, domiaKey)
		return { ok: true, data: config, source: "live" }
	} catch (err) {
		const fallback = await snapshotFallback(domiaKey)
		if (fallback) return fallback
		return {
			ok: false,
			error:
				err instanceof Error ? err.message : "Could not load configuration",
		}
	}
}

export const getConfigSchema = async (
	domiaKey: string,
): Promise<ConfigSchemaResult> => {
	const base = await onlineBaseFor(domiaKey)
	if (!base) return { schema: CONFIG_SCHEMA_SNAPSHOT, source: "snapshot" }
	try {
		const schema = await nodeGetConfigSchema(
			base,
			env.DOMIA_NODE_PROBE_TIMEOUT_MS,
		)
		if (!Array.isArray(schema?.sections) || schema.sections.length === 0)
			return { schema: CONFIG_SCHEMA_SNAPSHOT, source: "snapshot" }
		return { schema, source: "live" }
	} catch {
		return { schema: CONFIG_SCHEMA_SNAPSHOT, source: "snapshot" }
	}
}

export const importConfig = async (
	input: ImportConfigInput,
): Promise<ActionResult<ConfigImportResult>> => {
	const base = await resolveBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeImportConfig(
			base.data!,
			input.bundle,
			input.domiaKey,
		)
		return { ok: true, data: result }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not apply changes",
		}
	}
}

export const getConfigHealth = async (
	domiaKey: string,
): Promise<ActionResult<ConfigHealth>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		const { health } = await nodeGetConfigHealth(base.data!, domiaKey)
		return { ok: true, data: health }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not load diagnostics",
		}
	}
}

export const restartDomia = async (
	domiaKey: string,
): Promise<ActionResult<boolean>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		const { restarting } = await nodeRestart(base.data!)
		return { ok: true, data: restarting }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not restart Domia",
		}
	}
}
