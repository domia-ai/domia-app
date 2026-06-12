import { getNodeEndpoint } from "@/services/fleet"
import { getDomia } from "@/services/domia"
import { domiaConfigToSnapshot } from "@/utils/config"
import { DEFAULT_CONFIG_SNAPSHOT } from "@/constants/config-defaults"
import {
	nodeGetConfig,
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
	ImportConfigInput,
} from "@/types/config"

const resolveBase = async (domiaKey: string): Promise<ActionResult<string>> => {
	const endpoint = await getNodeEndpoint(domiaKey)
	if (!endpoint)
		return { ok: false, error: "This Domia has no reachable address" }
	return { ok: true, data: `http://${endpoint.localIp}:${endpoint.httpPort}` }
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
		const { config } = await nodeGetConfig(base.data!)
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

export const importConfig = async (
	input: ImportConfigInput,
): Promise<ActionResult<ConfigImportResult>> => {
	const base = await resolveBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeImportConfig(base.data!, input.bundle)
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
		const { health } = await nodeGetConfigHealth(base.data!)
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
