import { getNodeEndpoint } from "@/services/fleet"
import {
	nodeGetKnowledge,
	nodeUpsertKnowledge,
	nodeDeleteKnowledge,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { KnowledgeEntry, KnowledgeInput } from "@/types/knowledge"

const resolveBase = async (domiaKey: string): Promise<ActionResult<string>> => {
	const endpoint = await getNodeEndpoint(domiaKey)
	if (!endpoint)
		return { ok: false, error: "This Domia has no reachable address" }
	return { ok: true, data: `http://${endpoint.localIp}:${endpoint.httpPort}` }
}

export const listKnowledge = async (
	domiaKey: string,
): Promise<ActionResult<KnowledgeEntry[]>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		const { entries } = await nodeGetKnowledge(base.data!, domiaKey)
		return { ok: true, data: entries }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not load knowledge",
		}
	}
}

export const saveKnowledge = async (
	domiaKey: string,
	input: KnowledgeInput,
): Promise<ActionResult<boolean>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		await nodeUpsertKnowledge(base.data!, input, domiaKey)
		return { ok: true, data: true }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not save entry",
		}
	}
}

export const removeKnowledge = async (
	domiaKey: string,
	id: string,
): Promise<ActionResult<boolean>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		await nodeDeleteKnowledge(base.data!, id, domiaKey)
		return { ok: true, data: true }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not delete entry",
		}
	}
}
