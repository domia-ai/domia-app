import { getNodeEndpoint } from "@/services/fleet"
import { nodeGetMind, nodeImportMind } from "@/lib/node-client"
import { listTemplates } from "@/services/templates"
import type { ActionResult } from "@/types"
import type {
	ImportMindInput,
	MindEditorData,
	MindSnapshot,
} from "@/types/mind"

const resolveBase = async (domiaKey: string): Promise<ActionResult<string>> => {
	const endpoint = await getNodeEndpoint(domiaKey)
	if (!endpoint)
		return { ok: false, error: "This Domia has no reachable address" }
	return { ok: true, data: `http://${endpoint.localIp}:${endpoint.httpPort}` }
}

export const getMindEditor = async (
	domiaKey: string,
): Promise<ActionResult<MindEditorData>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		const { mind } = await nodeGetMind(base.data!)
		return { ok: true, data: { mind, templates: listTemplates() } }
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error ? err.message : "Could not load configuration",
		}
	}
}

export const importMind = async (
	input: ImportMindInput,
): Promise<ActionResult<MindSnapshot>> => {
	const base = await resolveBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const { mind } = await nodeImportMind(base.data!, input.mind)
		return { ok: true, data: mind }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not apply changes",
		}
	}
}
