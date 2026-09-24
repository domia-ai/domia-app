import { resolveNodeBase } from "@/services/fleet"
import {
	nodeCancelProactivityItem,
	nodeCancelSatelliteTimer,
	nodeCreateProactivityItem,
	nodeGetProactivitySchedule,
	nodeGetProactivityStatus,
	nodeListSatelliteTimers,
	nodeListSatellites,
	nodeStartSatelliteTimer,
} from "@/lib/node-client"
import {
	AGENDA_ACTIVE_STATUSES,
	REMINDER_TEMPLATE_KEY,
	agendaKindOf,
} from "@/constants/proactivity"
import { isNodeRequestError, nodeFailure } from "@/utils/service-errors"
import type { ActionResult } from "@/types"
import type { BoundSatelliteRow } from "@/types/satellites"
import type {
	AgendaItem,
	AgendaListView,
	CancelAgendaInput,
	CancelAgendaResult,
	CancelSatelliteTimerInput,
	CreateReminderInput,
	CreateReminderResult,
	ProactivityStatus,
	ProactivityStatusView,
	SatelliteTimer,
	SatelliteTimersInput,
	SatelliteTimersView,
	ScheduleItem,
	StartSatelliteTimerInput,
	StartTimerResult,
} from "@/types/proactivity"

const statusCodeOf = (err: unknown): number | null =>
	isNodeRequestError(err) ? err.status : null

const toStatusView = (status: ProactivityStatus): ProactivityStatusView => ({
	domiaKey: status.domiaKey,
	engine: status.engine,
	running: status.running,
	busy: status.busy,
	quietHours: {
		start: status.quietHours.start ?? null,
		end: status.quietHours.end ?? null,
		active: status.quietHours.active,
	},
	budget: {
		hourUsed: status.budget.hourUsed,
		hourMax: status.budget.hourMax,
		dayUsed: status.budget.dayUsed,
		dayMax: status.budget.dayMax,
	},
	idleNudge: {
		enabled: status.idleNudge.enabled,
		idleAfterMs: status.idleNudge.idleAfterMs,
		minIntervalMs: status.idleNudge.minIntervalMs,
		lastActivityAt: status.idleNudge.lastActivityAt ?? null,
		lastActivitySatelliteId: status.idleNudge.lastActivitySatelliteId ?? null,
		idleForMs: status.idleNudge.idleForMs ?? null,
		armed: status.idleNudge.armed,
		lastNudgeAt: status.idleNudge.lastNudgeAt ?? null,
		decision: status.idleNudge.decision,
	},
	schedule: {
		pending: status.schedule.pending,
		leased: status.schedule.leased,
		done: status.schedule.done,
		failed: status.schedule.failed,
		cancelled: status.schedule.cancelled,
		nextDueAt: status.schedule.nextDueAt ?? null,
	},
	lastTickAt: status.lastTickAt ?? null,
	lastOutcome: status.lastOutcome ?? null,
})

const labelOf = (item: ScheduleItem): string =>
	item.templateParams?.label?.trim() || item.name

const toAgendaItem = (
	item: ScheduleItem,
	nameById: Map<string, string>,
	now: number,
): AgendaItem => ({
	id: item.id,
	kind: agendaKindOf(item.templateKey),
	label: labelOf(item),
	text: item.text,
	verb: item.verb,
	importance: item.importance,
	status: item.status,
	templateKey: item.templateKey,
	dueAt: item.dueAt,
	dueInMs: Date.parse(item.dueAt) - now,
	repeatEveryMs: item.repeatEveryMs,
	repeatDailyAt: item.repeatDailyAt,
	targetKind: item.targetKind,
	targetSatelliteId: item.targetSatelliteId,
	satelliteName: item.targetSatelliteId
		? (nameById.get(item.targetSatelliteId) ?? item.targetSatelliteId)
		: null,
	attempts: item.attempts,
	firedCount: item.firedCount,
	lastFiredAt: item.lastFiredAt,
	lastError: item.lastError,
	createdAt: item.createdAt,
})

const satelliteNames = async (
	base: string,
	domiaKey: string,
): Promise<Map<string, string>> => {
	const satellites = await nodeListSatellites(base, domiaKey)
		.then((res) => res.satellites)
		.catch((): BoundSatelliteRow[] => [])
	return new Map(
		satellites.map((sat) => [sat.satelliteId, sat.name ?? sat.satelliteId]),
	)
}

export const getProactivityStatus = async (
	domiaKey: string,
): Promise<ActionResult<ProactivityStatusView>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const status = await nodeGetProactivityStatus(base.data, domiaKey)
		return { ok: true, data: toStatusView(status) }
	} catch (err) {
		return nodeFailure(err, "Could not read the proactivity runtime")
	}
}

export const getAgenda = async (
	domiaKey: string,
): Promise<ActionResult<AgendaListView>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const [{ items }, nameById] = await Promise.all([
			nodeGetProactivitySchedule(base.data, domiaKey, AGENDA_ACTIVE_STATUSES),
			satelliteNames(base.data, domiaKey),
		])
		const now = Date.now()
		const decorated = items
			.map((item) => toAgendaItem(item, nameById, now))
			.sort((a, b) => a.dueInMs - b.dueInMs)
		return { ok: true, data: { items: decorated } }
	} catch (err) {
		return nodeFailure(err, "Could not read the agenda")
	}
}

export const createReminder = async ({
	domiaKey,
	name,
	inMs,
}: CreateReminderInput): Promise<ActionResult<CreateReminderResult>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { item } = await nodeCreateProactivityItem(base.data, domiaKey, {
			name,
			templateKey: REMINDER_TEMPLATE_KEY,
			templateParams: { text: name, label: name },
			verb: "announce",
			importance: "normal",
			inMs,
		})
		return {
			ok: true,
			data: { id: item.id, name: item.name, dueAt: item.dueAt },
		}
	} catch (err) {
		return nodeFailure(err, "Could not create the reminder")
	}
}

export const cancelAgendaItem = async ({
	domiaKey,
	id,
	templateKey,
	targetSatelliteId,
}: CancelAgendaInput): Promise<ActionResult<CancelAgendaResult>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	const mirrorToSatellite =
		!!targetSatelliteId && !!templateKey && templateKey.startsWith("timer")
	try {
		if (mirrorToSatellite)
			await nodeCancelSatelliteTimer(base.data, domiaKey, targetSatelliteId, id)
		else await nodeCancelProactivityItem(base.data, domiaKey, id)
		return { ok: true, data: { outcome: "cancelled" } }
	} catch (err) {
		const code = statusCodeOf(err)
		if (code === 409) return { ok: true, data: { outcome: "settled" } }
		if (code === 404) return { ok: true, data: { outcome: "missing" } }
		return nodeFailure(err, "Could not cancel the item")
	}
}

export const listSatelliteTimers = async ({
	domiaKey,
	satelliteId,
}: SatelliteTimersInput): Promise<ActionResult<SatelliteTimersView>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { timers } = await nodeListSatelliteTimers(
			base.data,
			domiaKey,
			satelliteId,
		)
		const rows: SatelliteTimer[] = timers.map((timer) => ({
			timerId: timer.timerId,
			name: timer.name,
			totalSeconds: timer.totalSeconds,
			secondsLeft: timer.secondsLeft,
		}))
		return { ok: true, data: { timers: rows } }
	} catch (err) {
		return nodeFailure(err, "Could not read the timers")
	}
}

export const startSatelliteTimer = async ({
	domiaKey,
	satelliteId,
	name,
	seconds,
}: StartSatelliteTimerInput): Promise<ActionResult<StartTimerResult>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		await nodeStartSatelliteTimer(base.data, domiaKey, satelliteId, {
			name,
			seconds,
		})
		return { ok: true, data: { outcome: "started" } }
	} catch (err) {
		const code = statusCodeOf(err)
		if (code === 409) return { ok: true, data: { outcome: "unavailable" } }
		return nodeFailure(err, "Could not start the timer")
	}
}

export const cancelSatelliteTimer = async ({
	domiaKey,
	satelliteId,
	timerId,
}: CancelSatelliteTimerInput): Promise<ActionResult<CancelAgendaResult>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		await nodeCancelSatelliteTimer(base.data, domiaKey, satelliteId, timerId)
		return { ok: true, data: { outcome: "cancelled" } }
	} catch (err) {
		const code = statusCodeOf(err)
		if (code === 409) return { ok: true, data: { outcome: "settled" } }
		if (code === 404) return { ok: true, data: { outcome: "missing" } }
		return nodeFailure(err, "Could not cancel the timer")
	}
}
