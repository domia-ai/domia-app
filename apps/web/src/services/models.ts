import { resolveNodeBase } from "@/services/fleet"
import {
	nodeGetModels,
	nodeInstallModel,
	nodeGetModelJob,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { ModelsReport, ModelJob, InstallModelInput } from "@/types/config"

export const getModels = async (
	domiaKey: string,
): Promise<ActionResult<ModelsReport>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { models } = await nodeGetModels(base.data, domiaKey)
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
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const { job } = await nodeInstallModel(
			base.data,
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
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { job } = await nodeGetModelJob(base.data, jobId)
		return { ok: true, data: job }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not read job status",
		}
	}
}
