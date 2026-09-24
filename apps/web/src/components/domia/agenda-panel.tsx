import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { CalendarClock, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { AgendaItemRow } from "@/components/domia/agenda-item"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useActionQuery } from "@/hooks/use-query-state"
import { useNow } from "@/hooks/use-now"
import { isDemoMode } from "@/lib/demo"
import { relativeTime } from "@/utils/format"
import {
	REMINDER_MAX_MINUTES,
	REMINDER_MAX_NAME_CHARS,
	REMINDER_MIN_MINUTES,
	countdownText,
	gateReasonLabel,
} from "@/constants/proactivity"
import {
	cancelAgendaItemFn,
	createReminderFn,
	proactivityStatusQueryOptions,
	scheduleQueryOptions,
} from "@/server/proactivity"
import type { AgendaItem, AgendaPanelProps } from "@/types/proactivity"
import type { AgendaRuntimeStripProps } from "@/types/domia"

function RuntimeStrip({ status }: AgendaRuntimeStripProps) {
	return (
		<div className="flex flex-wrap items-center gap-2">
			{status.engine ? (
				<Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
					{m.agenda_engine_on()}
				</Badge>
			) : (
				<Badge variant="secondary">{m.agenda_engine_off()}</Badge>
			)}
			{status.busy ? <Badge variant="outline">{m.agenda_busy()}</Badge> : null}
			{status.quietHours.active ? (
				<Badge variant="outline">{m.agenda_quiet_active()}</Badge>
			) : null}
			<span className="text-muted-foreground text-xs">
				{m.agenda_budget({
					hourUsed: status.budget.hourUsed,
					hourMax: status.budget.hourMax,
					dayUsed: status.budget.dayUsed,
					dayMax: status.budget.dayMax,
				})}
			</span>
			{status.quietHours.start && status.quietHours.end ? (
				<span className="text-muted-foreground text-xs">
					·{" "}
					{m.agenda_quiet_hours({
						start: status.quietHours.start,
						end: status.quietHours.end,
					})}
				</span>
			) : null}
			<span className="text-muted-foreground text-xs">
				·{" "}
				{m.agenda_idle_decision({
					reason: gateReasonLabel(status.idleNudge.decision),
				})}
			</span>
			{status.lastTickAt ? (
				<span className="text-muted-foreground text-xs">
					· {m.agenda_last_tick({ when: relativeTime(status.lastTickAt) })}
				</span>
			) : null}
		</div>
	)
}

export function AgendaPanel({ domiaKey, online }: AgendaPanelProps) {
	const qc = useQueryClient()
	const now = useNow()
	const [name, setName] = useState("")
	const [minutes, setMinutes] = useState("10")
	const [cancellingId, setCancellingId] = useState<string | null>(null)

	const { state: statusState } = useActionQuery({
		...proactivityStatusQueryOptions(domiaKey),
		enabled: online,
		errorMessage: m.agenda_status_error,
	})
	const { state: agendaState } = useActionQuery({
		...scheduleQueryOptions(domiaKey),
		enabled: online,
		errorMessage: m.agenda_load_error,
	})

	const refresh = () => {
		void qc.invalidateQueries({ queryKey: ["proactivity-schedule", domiaKey] })
		void qc.invalidateQueries({ queryKey: ["proactivity-status", domiaKey] })
	}

	const create = useActionMutation({
		mutationFn: (vars: { name: string; inMs: number }) =>
			createReminderFn({ data: { domiaKey, ...vars } }),
		failureTitle: m.agenda_create_failed,
		onDone: (data) => {
			toast.success(m.agenda_created_toast({ name: data?.name ?? "" }))
			setName("")
			refresh()
		},
	})

	const cancel = useActionMutation({
		mutationFn: (item: AgendaItem) =>
			cancelAgendaItemFn({
				data: {
					domiaKey,
					id: item.id,
					templateKey: item.templateKey,
					targetSatelliteId: item.targetSatelliteId,
				},
			}),
		failureTitle: m.agenda_cancel_failed,
		onDone: (data) => {
			if (data?.outcome === "settled") toast.info(m.agenda_already_settled())
			else if (data?.outcome === "missing") toast.info(m.agenda_not_found())
			else toast.success(m.agenda_cancelled_toast())
			setCancellingId(null)
			refresh()
		},
		onFail: () => {
			setCancellingId(null)
			refresh()
		},
	})

	const parsedMinutes = Number(minutes.trim())
	const validMinutes =
		Number.isInteger(parsedMinutes) &&
		parsedMinutes >= REMINDER_MIN_MINUTES &&
		parsedMinutes <= REMINDER_MAX_MINUTES
	const trimmedName = name.trim()
	const canCreate =
		online &&
		!isDemoMode() &&
		!create.isPending &&
		trimmedName.length > 0 &&
		validMinutes

	const submit = () => {
		if (!canCreate) return
		create.mutate({ name: trimmedName, inMs: parsedMinutes * 60_000 })
	}

	const cancelItem = (item: AgendaItem) => {
		setCancellingId(item.id)
		cancel.mutate(item)
	}

	return (
		<Card>
			<CardHeader className="gap-1">
				<CardTitle className="flex items-center gap-2 text-base">
					<CalendarClock className="size-4" />
					{m.agenda_title()}
				</CardTitle>
				<p className="text-muted-foreground text-sm">{m.agenda_desc()}</p>
			</CardHeader>
			<CardContent className="space-y-4">
				{!online ? (
					<p className="text-muted-foreground text-sm">{m.agenda_offline()}</p>
				) : (
					<>
						<AsyncBoundary
							state={statusState}
							skeleton={<Skeleton className="h-6 w-full" />}
						>
							{(status) => (status ? <RuntimeStrip status={status} /> : null)}
						</AsyncBoundary>

						<div className="flex flex-wrap items-end gap-2">
							<Input
								className="min-w-40 flex-1"
								value={name}
								maxLength={REMINDER_MAX_NAME_CHARS}
								placeholder={m.agenda_reminder_placeholder()}
								disabled={!online || isDemoMode()}
								onChange={(e) => setName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter") submit()
								}}
							/>
							<div className="flex items-center gap-1.5">
								<Input
									className="w-20"
									type="number"
									inputMode="numeric"
									min={REMINDER_MIN_MINUTES}
									max={REMINDER_MAX_MINUTES}
									value={minutes}
									aria-invalid={!validMinutes}
									aria-label={m.agenda_minutes_label()}
									disabled={!online || isDemoMode()}
									onChange={(e) => setMinutes(e.target.value)}
								/>
								<span className="text-muted-foreground text-xs">
									{m.agenda_minutes_label()}
								</span>
							</div>
							<Button size="sm" disabled={!canCreate} onClick={submit}>
								{create.isPending ? (
									<Loader2 className="size-4 animate-spin" />
								) : (
									<Plus className="size-4" />
								)}
								{m.agenda_create()}
							</Button>
						</div>

						<AsyncBoundary
							state={agendaState}
							skeleton={<Skeleton className="h-24 w-full" />}
						>
							{(view) =>
								!view || view.items.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										{m.agenda_empty()}
									</p>
								) : (
									<ul className="space-y-2">
										{view.items.map((item) => (
											<AgendaItemRow
												key={item.id}
												item={item}
												busy={cancel.isPending && cancellingId === item.id}
												disabled={isDemoMode() || cancel.isPending}
												onCancel={cancelItem}
											/>
										))}
									</ul>
								)
							}
						</AsyncBoundary>

						<AsyncBoundary state={statusState} skeleton={null}>
							{(status) =>
								status?.schedule.nextDueAt ? (
									<p className="text-muted-foreground text-xs">
										{m.agenda_next_due({
											when: countdownText(
												Date.parse(status.schedule.nextDueAt) - now,
											),
										})}
									</p>
								) : null
							}
						</AsyncBoundary>
					</>
				)}
			</CardContent>
		</Card>
	)
}
