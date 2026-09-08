import { resolveNodeBase } from "@/services/fleet"
import { nodeGetSkills, nodeDiscoverSkillProviders } from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	SkillsStatusResult,
	DiscoveredSkillProvider,
} from "@/types/skills"

export const skillsStatus = async (
	domiaKey: string,
): Promise<ActionResult<SkillsStatusResult>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		return { ok: true, data: await nodeGetSkills(base.data, domiaKey) }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Skills status failed",
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
