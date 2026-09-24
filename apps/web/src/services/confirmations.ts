import { resolveNodeBase } from "@/services/fleet"
import { nodeGetConfirmations, nodeSettleConfirmation } from "@/lib/node-client"
import { nodeFailure } from "@/utils/service-errors"
import type { ActionResult } from "@/types"
import type {
	PendingConfirmation,
	SettleConfirmationInput,
	SettleConfirmationResult,
} from "@/types/confirmations"

const toConfirmation = (entry: PendingConfirmation): PendingConfirmation => ({
	scope: entry.scope,
	satelliteId: entry.satelliteId ?? null,
	tool: entry.tool,
	args: entry.args,
	resolvedArgs: entry.resolvedArgs ?? null,
	summary: entry.summary ?? null,
	language: entry.language ?? null,
	reasked: entry.reasked,
	expiresAt: entry.expiresAt,
})

export const listConfirmations = async (
	domiaKey: string,
): Promise<ActionResult<PendingConfirmation[]>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { confirmations } = await nodeGetConfirmations(base.data, domiaKey)
		return {
			ok: true,
			data: confirmations
				.map(toConfirmation)
				.sort((a, b) => a.expiresAt - b.expiresAt),
		}
	} catch (err) {
		return nodeFailure(err, "Could not load pending confirmations")
	}
}

export const settleConfirmation = async ({
	domiaKey,
	scope,
	decision,
}: SettleConfirmationInput): Promise<
	ActionResult<SettleConfirmationResult>
> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeSettleConfirmation(
			base.data,
			domiaKey,
			scope,
			decision,
		)
		return { ok: true, data: result }
	} catch (err) {
		return nodeFailure(err, "Could not settle the confirmation")
	}
}
