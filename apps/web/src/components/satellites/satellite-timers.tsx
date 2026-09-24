import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Loader2, Play, Timer, X } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useActionQuery } from "@/hooks/use-query-state"
import { useNow } from "@/hooks/use-now"
import { isDemoMode } from "@/lib/demo"
import {
	TIMER_MAX_SECONDS,
	TIMER_MIN_SECONDS,
	timerClock,
} from "@/constants/proactivity"
import {
	cancelSatelliteTimerFn,
	satelliteTimersQueryOptions,
	startSatelliteTimerFn,
} from "@/server/proactivity"
import type { SatelliteTimersProps } from "@/types/satellites"
import type { SatelliteTimer } from "@/types/proactivity"

export function SatelliteTimers({ satellite: s }: SatelliteTimersProps) {
	const qc = useQueryClient()
	const [name, setName] = useState("")
	const [minutes, setMinutes] = useState("5")
	const [cancellingId, setCancellingId] = useState<string | null>(null)
	const now = useNow()

	const { state, query } = useActionQuery({
		...satelliteTimersQueryOptions(s.domiaKey, s.satelliteId),
		enabled: s.online,
		errorMessage: m.sat_timers_load_error,
	})
	const elapsedSinceFetch = Math.max(0, now - query.dataUpdatedAt) / 1000

	const refresh = () => {
		void qc.invalidateQueries({
			queryKey: ["satellite-timers", s.domiaKey, s.satelliteId],
		})
		void qc.invalidateQueries({
			queryKey: ["proactivity-schedule", s.domiaKey],
		})
	}

	const start = useActionMutation({
		mutationFn: (vars: { name: string; seconds: number }) =>
			startSatelliteTimerFn({
				data: { domiaKey: s.domiaKey, satelliteId: s.satelliteId, ...vars },
			}),
		failureTitle: m.sat_timers_start_failed,
		onDone: (data) => {
			if (data?.outcome === "unavailable")
				toast.info(m.sat_timers_unavailable())
			else toast.success(m.sat_timers_started())
			setName("")
			refresh()
		},
	})

	const cancel = useActionMutation({
		mutationFn: (timer: SatelliteTimer) =>
			cancelSatelliteTimerFn({
				data: {
					domiaKey: s.domiaKey,
					satelliteId: s.satelliteId,
					timerId: timer.timerId,
				},
			}),
		failureTitle: m.sat_timers_cancel_failed,
		onDone: (data) => {
			if (data?.outcome === "missing") toast.info(m.sat_timers_gone())
			else if (data?.outcome === "settled") toast.info(m.sat_timers_gone())
			else toast.success(m.sat_timers_cancelled())
			setCancellingId(null)
			refresh()
		},
		onFail: () => {
			setCancellingId(null)
			refresh()
		},
	})

	const parsedMinutes = Number(minutes.trim())
	const seconds = Math.round(parsedMinutes * 60)
	const validSeconds =
		Number.isFinite(parsedMinutes) &&
		seconds >= TIMER_MIN_SECONDS &&
		seconds <= TIMER_MAX_SECONDS
	const disabled = !s.online || isDemoMode()

	const submit = () => {
		if (disabled || start.isPending || !validSeconds) return
		start.mutate({ name: name.trim() || m.sat_timers_default_name(), seconds })
	}

	return (
		<div className="flex flex-col gap-2">
			<p className="text-muted-foreground mb-0.5 flex items-center gap-1.5 text-[11px] font-medium tracking-wide uppercase">
				<Timer className="size-3.5" />
				{m.sat_timers_title()}
			</p>

			{!s.online ? (
				<p className="text-muted-foreground text-xs">
					{m.sat_timers_offline()}
				</p>
			) : (
				<>
					<AsyncBoundary
						state={state}
						skeleton={<Skeleton className="h-10 w-full" />}
					>
						{(view) =>
							!view || view.timers.length === 0 ? (
								<p className="text-muted-foreground text-xs">
									{m.sat_timers_empty()}
								</p>
							) : (
								<ul className="flex flex-col gap-1.5">
									{view.timers.map((timer) => (
										<li
											key={timer.timerId}
											className="border-border flex items-center justify-between gap-2 rounded-md border px-2.5 py-1.5"
										>
											<span className="min-w-0 truncate text-xs">
												{timer.name}
											</span>
											<span className="text-muted-foreground font-mono text-xs tabular-nums">
												{timerClock(timer.secondsLeft - elapsedSinceFetch)}
											</span>
											<Button
												variant="ghost"
												size="sm"
												disabled={disabled || cancel.isPending}
												aria-label={m.sat_timers_cancel()}
												onClick={() => {
													setCancellingId(timer.timerId)
													cancel.mutate(timer)
												}}
											>
												{cancel.isPending && cancellingId === timer.timerId ? (
													<Loader2 className="size-3.5 animate-spin" />
												) : (
													<X className="size-3.5" />
												)}
											</Button>
										</li>
									))}
								</ul>
							)
						}
					</AsyncBoundary>

					<div className="flex items-center gap-1.5">
						<Input
							className="min-w-24 flex-1"
							value={name}
							maxLength={120}
							placeholder={m.sat_timers_name_placeholder()}
							disabled={disabled}
							onChange={(e) => setName(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") submit()
							}}
						/>
						<Input
							className="w-16"
							type="number"
							inputMode="numeric"
							min={1}
							value={minutes}
							aria-invalid={!validSeconds}
							aria-label={m.sat_timers_minutes()}
							disabled={disabled}
							onChange={(e) => setMinutes(e.target.value)}
						/>
						<Button
							variant="outline"
							size="sm"
							disabled={disabled || start.isPending || !validSeconds}
							onClick={submit}
						>
							{start.isPending ? (
								<Loader2 className="size-3.5 animate-spin" />
							) : (
								<Play className="size-3.5" />
							)}
							{m.sat_timers_start()}
						</Button>
					</div>
				</>
			)}
		</div>
	)
}
