import { AlarmClock, Bell, Sparkles, Timer } from "lucide-react"
import { m } from "@/paraglide/messages"
import type {
	AgendaKind,
	AgendaKindMeta,
	ProactiveGateReason,
	ProactiveScheduleStatus,
} from "@/types/proactivity"

export const PROACTIVITY_REFETCH_MS = 15_000

export const REMINDER_TEMPLATE_KEY = "reminderDue"

export const AGENDA_ACTIVE_STATUSES: readonly ProactiveScheduleStatus[] = [
	"pending",
	"leased",
]

export const AGENDA_KIND_BY_TEMPLATE: Record<string, AgendaKind> = {
	timerFinished: "timer",
	timerFinishedLate: "timer",
	alarmRing: "alarm",
	alarmRingLate: "alarm",
	reminderDue: "reminder",
}

export const AGENDA_KIND_META: Record<AgendaKind, AgendaKindMeta> = {
	timer: { label: m.agenda_kind_timer, icon: Timer },
	alarm: { label: m.agenda_kind_alarm, icon: AlarmClock },
	reminder: { label: m.agenda_kind_reminder, icon: Bell },
	nudge: { label: m.agenda_kind_nudge, icon: Sparkles },
}

export const AGENDA_STATUS_LABELS: Record<
	ProactiveScheduleStatus,
	() => string
> = {
	pending: m.agenda_status_pending,
	leased: m.agenda_status_leased,
	done: m.agenda_status_done,
	cancelled: m.agenda_status_cancelled,
	failed: m.agenda_status_failed,
}

const GATE_REASON_LABELS: Record<ProactiveGateReason, () => string> = {
	ok: m.agenda_gate_ok,
	"engine-off": m.agenda_gate_engine_off,
	"nudge-off": m.agenda_gate_nudge_off,
	"quiet-hours": m.agenda_gate_quiet_hours,
	"budget-hour": m.agenda_gate_budget_hour,
	"budget-day": m.agenda_gate_budget_day,
	"rate-limit": m.agenda_gate_rate_limit,
	"no-activity": m.agenda_gate_no_activity,
	"idle-not-reached": m.agenda_gate_idle_not_reached,
	"already-nudged": m.agenda_gate_already_nudged,
	busy: m.agenda_gate_busy,
	"no-delivery": m.agenda_gate_no_delivery,
	"lease-lost": m.agenda_gate_lease_lost,
}

export const gateReasonLabel = (reason: string): string =>
	GATE_REASON_LABELS[reason as ProactiveGateReason]?.() ??
	m.agenda_gate_unknown()

export const agendaKindOf = (templateKey: string | null): AgendaKind =>
	(templateKey ? AGENDA_KIND_BY_TEMPLATE[templateKey] : undefined) ?? "nudge"

export const countdownText = (ms: number): string => {
	if (ms <= 0) return m.agenda_due_now()
	const totalSeconds = Math.round(ms / 1000)
	if (totalSeconds < 60)
		return m.agenda_in_seconds({ seconds: totalSeconds.toString() })
	const minutes = Math.floor(totalSeconds / 60)
	if (minutes < 60)
		return m.agenda_in_minutes({
			minutes: minutes.toString(),
			seconds: (totalSeconds % 60).toString(),
		})
	const hours = Math.floor(minutes / 60)
	if (hours < 24)
		return m.agenda_in_hours({
			hours: hours.toString(),
			minutes: (minutes % 60).toString(),
		})
	return m.agenda_in_days({
		days: Math.floor(hours / 24).toString(),
		hours: (hours % 24).toString(),
	})
}

export const timerClock = (seconds: number): string => {
	const safe = Math.max(0, Math.round(seconds))
	const hours = Math.floor(safe / 3600)
	const minutes = Math.floor((safe % 3600) / 60)
	const rest = safe % 60
	const pad = (value: number): string => value.toString().padStart(2, "0")
	return hours > 0
		? `${hours}:${pad(minutes)}:${pad(rest)}`
		: `${minutes}:${pad(rest)}`
}

export const REMINDER_MAX_NAME_CHARS = 120
export const REMINDER_MIN_MINUTES = 1
export const REMINDER_MAX_MINUTES = 10_080
export const TIMER_MIN_SECONDS = 1
export const TIMER_MAX_SECONDS = 86_400
