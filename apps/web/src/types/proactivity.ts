import type { LucideIcon } from "lucide-react"
import type { z } from "zod"
import type { proactivityStatusSchema } from "@/schemas/proactivity"

export type ProactiveVerb = "announce" | "converse"

export type ProactiveImportance = "critical" | "normal" | "ambient"

export type ProactiveScheduleStatus =
	| "pending"
	| "leased"
	| "done"
	| "cancelled"
	| "failed"

export type ProactiveTargetKind = "auto" | "local" | "satellite"

export type ProactiveGateReason =
	| "ok"
	| "engine-off"
	| "nudge-off"
	| "quiet-hours"
	| "budget-hour"
	| "budget-day"
	| "rate-limit"
	| "no-activity"
	| "idle-not-reached"
	| "already-nudged"
	| "busy"
	| "no-delivery"
	| "lease-lost"

export type ScheduleItem = {
	id: string
	domiaId: string
	personId: string | null
	name: string
	text: string | null
	templateKey: string | null
	templateParams: Record<string, string> | null
	verb: ProactiveVerb
	importance: ProactiveImportance
	targetKind: ProactiveTargetKind
	targetSatelliteId: string | null
	actionTool: string | null
	actionArgs: Record<string, unknown> | null
	dueAt: string
	repeatEveryMs: number | null
	repeatDailyAt: string | null
	status: ProactiveScheduleStatus
	leaseUntil: string | null
	leaseOwner: string | null
	attempts: number
	firedCount: number
	lastFiredAt: string | null
	lastError: string | null
	createdAt: string
	updatedAt: string
}

export type ProactivityStatus = z.infer<typeof proactivityStatusSchema>

export type ScheduleListResult = {
	items: ScheduleItem[]
}

export type CreateScheduleResult = {
	item: ScheduleItem
}

export type CancelScheduleResult = {
	cancelled: boolean
	item: ScheduleItem
}

export type CreateScheduleInput = {
	name: string
	text?: string | null
	templateKey?: string | null
	templateParams?: Record<string, string> | null
	verb?: ProactiveVerb
	importance?: ProactiveImportance
	targetKind?: ProactiveTargetKind
	targetSatelliteId?: string | null
	actionTool?: string | null
	actionArgs?: Record<string, unknown> | null
	personId?: string | null
	dueAt?: string
	inMs?: number
	repeatEveryMs?: number | null
	repeatDailyAt?: string | null
}

export type SatelliteTimer = {
	timerId: string
	name: string
	totalSeconds: number
	secondsLeft: number
}

export type SatelliteTimersResult = {
	timers: SatelliteTimer[]
}

export type StartSatelliteTimerBody = {
	name?: string
	seconds: number
}

export type StartSatelliteTimerResult = {
	started: boolean
	timerId: string
}

export type CancelSatelliteTimerResult = {
	cancelled: boolean
}

export type ProactivityQuietHours = {
	start: string | null
	end: string | null
	active: boolean
}

export type ProactivityBudget = {
	hourUsed: number
	hourMax: number
	dayUsed: number
	dayMax: number
}

export type ProactivityIdleNudge = {
	enabled: boolean
	idleAfterMs: number
	minIntervalMs: number
	lastActivityAt: string | null
	lastActivitySatelliteId: string | null
	idleForMs: number | null
	armed: boolean
	lastNudgeAt: string | null
	decision: ProactiveGateReason
}

export type ProactivityScheduleCounts = {
	pending: number
	leased: number
	done: number
	failed: number
	cancelled: number
	nextDueAt: string | null
}

export type ProactivityStatusView = {
	domiaKey: string
	engine: boolean
	running: boolean
	busy: boolean
	quietHours: ProactivityQuietHours
	budget: ProactivityBudget
	idleNudge: ProactivityIdleNudge
	schedule: ProactivityScheduleCounts
	lastTickAt: string | null
	lastOutcome: string | null
}

export type AgendaKind = "timer" | "alarm" | "reminder" | "nudge"

export type AgendaItem = {
	id: string
	kind: AgendaKind
	label: string
	text: string | null
	verb: ProactiveVerb
	importance: ProactiveImportance
	status: ProactiveScheduleStatus
	templateKey: string | null
	dueAt: string
	dueInMs: number
	repeatEveryMs: number | null
	repeatDailyAt: string | null
	targetKind: ProactiveTargetKind
	targetSatelliteId: string | null
	satelliteName: string | null
	attempts: number
	firedCount: number
	lastFiredAt: string | null
	lastError: string | null
	createdAt: string
}

export type AgendaListView = {
	items: AgendaItem[]
}

export type CreateReminderInput = {
	domiaKey: string
	name: string
	inMs: number
}

export type CreateReminderResult = {
	id: string
	name: string
	dueAt: string
}

export type CancelAgendaInput = {
	domiaKey: string
	id: string
	templateKey: string | null
	targetSatelliteId: string | null
}

export type CancelAgendaOutcome = "cancelled" | "settled" | "missing"

export type CancelAgendaResult = {
	outcome: CancelAgendaOutcome
}

export type StartTimerOutcome = "started" | "unavailable"

export type StartTimerResult = {
	outcome: StartTimerOutcome
}

export type SatelliteTimersInput = {
	domiaKey: string
	satelliteId: string
}

export type SatelliteTimersView = {
	timers: SatelliteTimer[]
}

export type StartSatelliteTimerInput = {
	domiaKey: string
	satelliteId: string
	name: string
	seconds: number
}

export type CancelSatelliteTimerInput = {
	domiaKey: string
	satelliteId: string
	timerId: string
}

export type AgendaPanelProps = {
	domiaKey: string
	online: boolean
}

export type AgendaItemProps = {
	item: AgendaItem
	busy: boolean
	disabled: boolean
	onCancel: (item: AgendaItem) => void
}

export type AgendaKindMeta = {
	label: () => string
	icon: LucideIcon
}
