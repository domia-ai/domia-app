import { resolveNodeBase } from "@/services/fleet"
import {
	nodeApplyVoiceFeel,
	nodeGetVoiceFeel,
	nodeRevertVoiceFeel,
} from "@/lib/node-client"
import { nodeFailure } from "@/utils/service-errors"
import type { ActionResult } from "@/types"
import type {
	VoiceFeelActionInput,
	VoiceFeelMutationResult,
	VoiceFeelSnapshot,
} from "@/types/voice-feel"

export const getVoiceFeel = async (
	domiaKey: string,
): Promise<ActionResult<VoiceFeelSnapshot>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		return { ok: true, data: await nodeGetVoiceFeel(base.data, domiaKey) }
	} catch (err) {
		return nodeFailure(err, "Could not load tuning")
	}
}

export const applyVoiceFeel = async (
	input: VoiceFeelActionInput,
): Promise<ActionResult<VoiceFeelMutationResult>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		return {
			ok: true,
			data: await nodeApplyVoiceFeel(base.data, input.domiaKey, input.id),
		}
	} catch (err) {
		return nodeFailure(err, "Could not apply the suggestion")
	}
}

export const revertVoiceFeel = async (
	input: VoiceFeelActionInput,
): Promise<ActionResult<VoiceFeelMutationResult>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		return {
			ok: true,
			data: await nodeRevertVoiceFeel(base.data, input.domiaKey, input.id),
		}
	} catch (err) {
		return nodeFailure(err, "Could not undo the suggestion")
	}
}
