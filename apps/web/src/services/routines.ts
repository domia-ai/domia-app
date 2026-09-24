import { resolveNodeBase } from "@/services/fleet"
import {
	nodeDeleteRoutine,
	nodeGetRoutines,
	nodeSaveRoutine,
	nodeTryFastPath,
} from "@/lib/node-client"
import { nodeFailure } from "@/utils/service-errors"
import type { ActionResult } from "@/types"
import type {
	FastPathVerdict,
	Routine,
	RoutineInput,
	SaveRoutineResult,
} from "@/types/routines"

export const listRoutines = async (
	domiaKey: string,
): Promise<ActionResult<Routine[]>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { routines } = await nodeGetRoutines(base.data, domiaKey)
		return { ok: true, data: routines }
	} catch (err) {
		return nodeFailure(err, "Could not load routines")
	}
}

export const saveRoutine = async (
	domiaKey: string,
	input: RoutineInput,
): Promise<ActionResult<SaveRoutineResult>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		return { ok: true, data: await nodeSaveRoutine(base.data, domiaKey, input) }
	} catch (err) {
		return nodeFailure(err, "Could not save routine")
	}
}

export const removeRoutine = async (
	domiaKey: string,
	id: string,
): Promise<ActionResult<boolean>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		await nodeDeleteRoutine(base.data, domiaKey, id)
		return { ok: true, data: true }
	} catch (err) {
		return nodeFailure(err, "Could not delete routine")
	}
}

export const tryFastPath = async (
	domiaKey: string,
	text: string,
): Promise<ActionResult<FastPathVerdict>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { verdict } = await nodeTryFastPath(base.data, domiaKey, text)
		return { ok: true, data: verdict }
	} catch (err) {
		return nodeFailure(err, "Could not try the phrase")
	}
}
