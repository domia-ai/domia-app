import { Loader2, Repeat, Speaker, X } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useNow } from "@/hooks/use-now"
import { cn } from "@/lib/utils"
import { relativeTime } from "@/utils/format"
import {
	AGENDA_KIND_META,
	AGENDA_STATUS_LABELS,
	countdownText,
} from "@/constants/proactivity"
import type { AgendaItemProps } from "@/types/proactivity"

const repeatText = (
	repeatEveryMs: number | null,
	repeatDailyAt: string | null,
): string | null => {
	if (repeatDailyAt) return m.agenda_repeat_daily({ at: repeatDailyAt })
	if (repeatEveryMs)
		return m.agenda_repeat_every({
			every: countdownText(repeatEveryMs),
		})
	return null
}

export function AgendaItemRow({
	item,
	busy,
	disabled,
	onCancel,
}: AgendaItemProps) {
	const meta = AGENDA_KIND_META[item.kind]
	const Icon = meta.icon
	const repeat = repeatText(item.repeatEveryMs, item.repeatDailyAt)
	const now = useNow()
	const dueInMs = Date.parse(item.dueAt) - now
	const overdue = dueInMs <= 0

	return (
		<li className="flex items-start gap-3 rounded-lg border px-3 py-2.5">
			<span className="bg-muted text-muted-foreground mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full">
				<Icon className="size-3.5" />
			</span>
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex flex-wrap items-center gap-x-2 gap-y-1">
					<span className="truncate text-sm font-medium">{item.label}</span>
					<Badge variant="outline" className="text-[10px]">
						{meta.label()}
					</Badge>
					{item.status === "leased" ? (
						<Badge variant="secondary" className="text-[10px]">
							{AGENDA_STATUS_LABELS[item.status]()}
						</Badge>
					) : null}
				</div>
				<p
					className={cn(
						"text-xs tabular-nums",
						overdue ? "text-amber-700 dark:text-amber-400" : "text-foreground",
					)}
				>
					{countdownText(dueInMs)}
					<span className="text-muted-foreground">
						{" · "}
						{relativeTime(item.dueAt)}
					</span>
				</p>
				<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]">
					{item.satelliteName ? (
						<span className="flex items-center gap-1">
							<Speaker className="size-3" />
							{item.satelliteName}
						</span>
					) : null}
					{repeat ? (
						<span className="flex items-center gap-1">
							<Repeat className="size-3" />
							{repeat}
						</span>
					) : null}
					{item.attempts > 0 ? (
						<span>{m.agenda_attempts({ count: item.attempts })}</span>
					) : null}
				</div>
				{item.lastError ? (
					<p className="text-destructive text-[11px]">{item.lastError}</p>
				) : null}
			</div>
			<Button
				variant="ghost"
				size="sm"
				disabled={disabled || busy}
				aria-label={m.agenda_cancel()}
				onClick={() => onCancel(item)}
			>
				{busy ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					<X className="size-4" />
				)}
			</Button>
		</li>
	)
}
