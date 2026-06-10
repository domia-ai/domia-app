import { getNodeEndpoint } from "@/services/fleet"
import {
	nodeGetConfig,
	nodeImportConfig,
	nodeGetConfigHealth,
	nodeRestart,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	ConfigSnapshot,
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

export const getConfig = async (
	domiaKey: string,
): Promise<ActionResult<ConfigSnapshot>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		const { config } = await nodeGetConfig(base.data!)
		return { ok: true, data: config }
	} catch (err) {
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
