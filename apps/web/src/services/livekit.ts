import { resolveNodeBase } from "@/services/fleet"
import { nodeGetLivekitToken } from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { LivekitTokenGrant } from "@/types/satellites"

export const getLivekitToken = async (input: {
	domiaKey: string
	satelliteId: string
}): Promise<ActionResult<LivekitTokenGrant>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const grant = await nodeGetLivekitToken(
			base.data,
			input.domiaKey,
			input.satelliteId,
		)
		return { ok: true, data: grant }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : String(err),
		}
	}
}
