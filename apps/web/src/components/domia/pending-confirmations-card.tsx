import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Check, ChevronDown, Loader2, ShieldQuestion, X } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { useActionQuery } from "@/hooks/use-query-state"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useNow } from "@/hooks/use-now"
import { isDemoMode } from "@/lib/demo"
import {
	confirmationsQueryOptions,
	settleConfirmationFn,
} from "@/server/confirmations"
import { formatMaybeJson } from "@/utils/format"
import type {
	ConfirmationDecision,
	PendingConfirmationsCardProps,
	SettleConfirmationInput,
} from "@/types/confirmations"
import type {
	ConfirmationArgsInspectorProps,
	ConfirmationRowProps,
} from "@/types/domia"

const countdown = (expiresAt: number, now: number): string => {
	const left = Math.max(0, Math.round((expiresAt - now) / 1000))
	const minutes = Math.floor(left / 60)
	const seconds = left % 60
	return `${minutes}:${String(seconds).padStart(2, "0")}`
}

function ArgsInspector({ entry }: ConfirmationArgsInspectorProps) {
	const value = entry.resolvedArgs ?? entry.args
	const text = formatMaybeJson(value)
	if (!text) return null
	return (
		<Collapsible>
			<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-[11px] outline-none">
				<ChevronDown className="size-3 transition-transform group-data-[panel-open]:rotate-180" />
				{entry.resolvedArgs ? m.conv_tool_resolved_args() : m.conv_tool_args()}
			</CollapsibleTrigger>
			<CollapsibleContent className="pt-1.5">
				<pre className="bg-background/60 overflow-x-auto rounded-md px-3 py-2 font-mono text-xs">
					{text}
				</pre>
			</CollapsibleContent>
		</Collapsible>
	)
}

function ConfirmationRow({
	entry,
	now,
	busy,
	disabled,
	onSettle,
}: ConfirmationRowProps) {
	const expired = entry.expiresAt <= now
	const locked = disabled || expired
	return (
		<div className="space-y-2.5 rounded-lg border px-3 py-2.5">
			<div className="flex flex-wrap items-center gap-1.5">
				<Badge variant="secondary" className="font-mono text-[10px]">
					{entry.tool}
				</Badge>
				{entry.reasked && (
					<Badge
						variant="outline"
						className="border-amber-400/60 text-[10px] text-amber-600 dark:text-amber-400"
					>
						{m.domia_confirmations_reasked()}
					</Badge>
				)}
				{entry.satelliteId && (
					<Badge
						variant="outline"
						className="text-muted-foreground text-[10px]"
					>
						{entry.satelliteId}
					</Badge>
				)}
				<span
					className={
						expired
							? "text-destructive ml-auto font-mono text-[11px] tabular-nums"
							: "text-muted-foreground ml-auto font-mono text-[11px] tabular-nums"
					}
				>
					{expired
						? m.domia_confirmations_expired()
						: m.domia_confirmations_expires_in({
								time: countdown(entry.expiresAt, now),
							})}
				</span>
			</div>

			{entry.summary && <p className="text-sm">{entry.summary}</p>}

			<ArgsInspector entry={entry} />

			<div className="flex flex-wrap items-center gap-2 border-t pt-2.5">
				<span className="text-muted-foreground truncate font-mono text-[10px]">
					{entry.scope}
				</span>
				<div className="ml-auto flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={locked}
						onClick={() => onSettle(entry.scope, "no")}
					>
						{busy ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<X className="size-4" />
						)}
						{m.domia_confirmations_deny()}
					</Button>
					<Button
						size="sm"
						disabled={locked}
						onClick={() => onSettle(entry.scope, "yes")}
					>
						{busy ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Check className="size-4" />
						)}
						{m.domia_confirmations_approve()}
					</Button>
				</div>
			</div>
		</div>
	)
}

export function PendingConfirmationsCard({
	domiaKey,
	online,
}: PendingConfirmationsCardProps) {
	const queryClient = useQueryClient()
	const now = useNow()
	const [busyScope, setBusyScope] = useState<string | null>(null)

	const { state } = useActionQuery({
		...confirmationsQueryOptions(domiaKey),
		enabled: online,
		errorMessage: m.domia_confirmations_error,
	})

	const mutation = useActionMutation({
		mutationFn: (vars: SettleConfirmationInput) =>
			settleConfirmationFn({ data: vars }),
		failureTitle: m.domia_confirmations_settle_failed,
		onDone: (data, vars) => {
			setBusyScope(null)
			if (data?.settled === false)
				toast.warning(m.domia_confirmations_gone(), {
					description: vars.scope,
				})
			else if (vars.decision === "yes")
				toast.success(m.domia_confirmations_approved(), {
					description: data?.text ?? undefined,
				})
			else toast.success(m.domia_confirmations_denied())
			void queryClient.invalidateQueries({
				queryKey: ["confirmations", domiaKey],
			})
		},
		onFail: () => setBusyScope(null),
	})

	const onSettle = (scope: string, decision: ConfirmationDecision) => {
		setBusyScope(scope)
		mutation.mutate({ domiaKey, scope, decision })
	}

	return (
		<Card>
			<CardHeader className="gap-1">
				<CardTitle className="flex items-center gap-2 text-base">
					<ShieldQuestion className="size-4" />
					{m.domia_confirmations_title()}
				</CardTitle>
				<p className="text-muted-foreground text-sm">
					{m.domia_confirmations_description()}
				</p>
			</CardHeader>
			<CardContent>
				{!online ? (
					<p className="text-muted-foreground text-sm">
						{m.domia_confirmations_offline()}
					</p>
				) : (
					<AsyncBoundary
						state={state}
						skeleton={<Skeleton className="h-20 w-full" />}
					>
						{(entries) =>
							entries && entries.length > 0 ? (
								<div className="space-y-2">
									{entries.map((entry) => (
										<ConfirmationRow
											key={entry.scope}
											entry={entry}
											now={now}
											busy={busyScope === entry.scope}
											disabled={
												isDemoMode() || mutation.isPending || busyScope !== null
											}
											onSettle={onSettle}
										/>
									))}
								</div>
							) : (
								<p className="text-muted-foreground text-sm">
									{m.domia_confirmations_empty()}
								</p>
							)
						}
					</AsyncBoundary>
				)}
			</CardContent>
		</Card>
	)
}
