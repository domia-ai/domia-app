import { ZodError } from "zod"
import { resolveNodeBase } from "@/services/fleet"
import {
	nodeGetSkills,
	nodeDiscoverSkillProviders,
	nodeGetDescriptorSchema,
} from "@/lib/node-client"
import { toSkillsStatusResult } from "@/utils/skills-status"
import type { ActionResult } from "@/types"
import type {
	SkillsStatusResult,
	DiscoveredSkillProvider,
	SkillDescriptorSchemaInfo,
} from "@/types/skills"

export const skillsStatus = async (
	domiaKey: string,
): Promise<ActionResult<SkillsStatusResult>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		return {
			ok: true,
			data: toSkillsStatusResult(await nodeGetSkills(base.data, domiaKey)),
		}
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof ZodError || !(err instanceof Error)
					? "Skills status failed"
					: err.message,
		}
	}
}

export const descriptorSchema = async (
	domiaKey: string,
): Promise<ActionResult<SkillDescriptorSchemaInfo>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { resourceUri, stripped, rejected, limits } =
			await nodeGetDescriptorSchema(base.data)
		return { ok: true, data: { resourceUri, stripped, rejected, limits } }
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof ZodError || !(err instanceof Error)
					? "Descriptor schema failed"
					: err.message,
		}
	}
}

export const discoverSkillProviders = async (
	anchorDomiaKey: string,
): Promise<ActionResult<DiscoveredSkillProvider[]>> => {
	const base = await resolveNodeBase(anchorDomiaKey)
	if (!base.ok) return base
	try {
		const { providers } = await nodeDiscoverSkillProviders(base.data)
		return { ok: true, data: providers }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Discovery failed",
		}
	}
}
