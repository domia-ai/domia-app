import { getNodeEndpoint } from "@/services/fleet"
import {
	nodeGetModels,
	nodeInstallModel,
	nodeGetModelJob,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { ModelsReport, ModelJob, InstallModelInput } from "@/types/config"

const resolveBase = async (domiaKey: string): Promise<ActionResult<string>> => {
	const endpoint = await getNodeEndpoint(domiaKey)
	if (!endpoint)
		return { ok: false, error: "This Domia has no reachable address" }
	return { ok: true, data: `http://${endpoint.localIp}:${endpoint.httpPort}` }
}

export const getModels = async (
	domiaKey: string,
): Promise<ActionResult<ModelsReport>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		const { models } = await nodeGetModels(base.data!, domiaKey)
		return { ok: true, data: models }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not load models",
		}
	}
}

export const installModel = async (
	input: InstallModelInput,
): Promise<ActionResult<ModelJob>> => {
	const base = await resolveBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const { job } = await nodeInstallModel(
			base.data!,
			input.spec,
			input.domiaKey,
		)
		return { ok: true, data: job }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not start install",
		}
	}
}

export const getModelJob = async (
	domiaKey: string,
	jobId: string,
): Promise<ActionResult<ModelJob>> => {
	const base = await resolveBase(domiaKey)
	if (!base.ok) return base
	try {
		const { job } = await nodeGetModelJob(base.data!, jobId, domiaKey)
		return { ok: true, data: job }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not read job status",
		}
	}
}
