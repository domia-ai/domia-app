import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Check, Loader2, SlidersHorizontal, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useActionQuery } from "@/hooks/use-query-state"
import { isDemoMode } from "@/lib/demo"
import { applyNeedsAttention, summarizeApply } from "@/lib/config-apply"
import { formatMs, relativeTime } from "@/utils/format"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import {
	applyVoiceFeelFn,
	revertVoiceFeelFn,
	voiceFeelQueryOptions,
} from "@/server/voice-feel"
import type {
	VoiceFeelAdjustmentRowProps,
	VoiceFeelBodyProps,
	VoiceFeelCardProps,
	VoiceFeelConfirmDialogProps,
	VoiceFeelFeatureGridProps,
} from "@/types/domia"
import type { PendingAction, VoiceFeelAdjustment } from "@/types/voice-feel"

const percent = (rate: number): string => `${Math.round(rate * 100)}%`

const knobLabel = (adjustment: VoiceFeelAdjustment): string =>
	`${adjustment.section}.${adjustment.field}`

const knobValue = (value: number): string =>
	Number.isInteger(value) ? String(value) : value.toFixed(3).replace(/0+$/, "")

function FeatureGrid({ features }: VoiceFeelFeatureGridProps) {
	const cells = [
		{ label: m.vf_feature_turns(), value: String(features.turns) },
		{
			label: m.vf_feature_early_barge_in(),
			value: percent(features.earlyBargeInRate),
		},
		{ label: m.vf_feature_cut_off(), value: percent(features.cutOffRate) },
		{
			label: m.vf_feature_perceived_ttfa(),
			value: formatMs(features.perceivedTtfaP50),
		},
		{ label: m.vf_feature_eou_delay(), value: formatMs(features.eouDelayP50) },
		{ label: m.vf_feature_no_speech(), value: percent(features.noSpeechRate) },
	]
	return (
		<div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
			{cells.map((cell) => (
				<div key={cell.label} className="rounded-lg border p-3">
					<p className="text-muted-foreground text-xs">{cell.label}</p>
					<p className="text-lg font-semibold tabular-nums">{cell.value}</p>
				</div>
			))}
		</div>
	)
}

function AdjustmentRow({
	adjustment,
	busy,
	online,
	onAct,
}: VoiceFeelAdjustmentRowProps) {
	const reverted = adjustment.revertedAt !== null
	const applied = adjustment.appliedAt !== null && !reverted
	const disabled = !online || busy || isDemoMode()
	return (
		<div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border px-3 py-2.5">
			<div className="min-w-0 flex-1 space-y-0.5">
				<div className="flex flex-wrap items-center gap-2">
					<span className="font-mono text-xs">{knobLabel(adjustment)}</span>
					<span className="font-mono text-xs tabular-nums">
						{knobValue(adjustment.from)} → {knobValue(adjustment.to)}
					</span>
					{reverted ? (
						<Badge variant="secondary" className="text-[10px]">
							{m.vf_status_reverted()}
						</Badge>
					) : applied ? (
						<Badge className="bg-emerald-600 text-[10px] text-white hover:bg-emerald-600">
							{m.vf_status_applied()}
						</Badge>
					) : (
						<Badge variant="outline" className="text-[10px]">
							{m.vf_status_suggested()}
						</Badge>
					)}
				</div>
				<p className="text-muted-foreground text-xs">
					{m.vf_evidence({
						rule: adjustment.ruleId,
						samples: String(adjustment.sampleSize),
						confidence: adjustment.confidence.toFixed(2),
					})}{" "}
					· {relativeTime(adjustment.createdAt)}
				</p>
			</div>
			{!reverted &&
				(applied ? (
					<Button
						variant="outline"
						size="sm"
						disabled={disabled}
						onClick={() => onAct({ kind: "revert", adjustment })}
					>
						<Undo2 className="size-4" />
						{m.vf_revert()}
					</Button>
				) : (
					<Button
						size="sm"
						disabled={disabled}
						onClick={() => onAct({ kind: "apply", adjustment })}
					>
						<Check className="size-4" />
						{m.vf_apply()}
					</Button>
				))}
		</div>
	)
}

function VoiceFeelBody({ snapshot, busy, online, onAct }: VoiceFeelBodyProps) {
	return (
		<div className="space-y-4">
			<div className="flex flex-wrap items-center gap-2">
				{snapshot.enabled ? (
					<Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
						{m.vf_enabled()}
					</Badge>
				) : (
					<Badge variant="secondary">{m.vf_disabled()}</Badge>
				)}
				<span className="text-muted-foreground text-xs">
					{m.vf_window({
						turns: String(snapshot.features.turns),
						window: String(snapshot.settings.windowTurns),
						minTurns: String(snapshot.settings.minTurns),
					})}
				</span>
				<span className="text-muted-foreground text-xs">
					·{" "}
					{m.vf_budget({
						used: String(snapshot.budgetUsedToday),
						budget: String(snapshot.settings.dailyBudget),
					})}
				</span>
				{snapshot.cooldowns.length > 0 && (
					<span className="text-muted-foreground text-xs">
						· {m.vf_cooldowns({ count: String(snapshot.cooldowns.length) })}
					</span>
				)}
			</div>

			<FeatureGrid features={snapshot.features} />

			{snapshot.adjustments.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{snapshot.enabled ? m.vf_empty() : m.vf_empty_disabled()}
				</p>
			) : (
				<div className="space-y-2">
					{snapshot.adjustments.map((adjustment) => (
						<AdjustmentRow
							key={adjustment.id}
							adjustment={adjustment}
							busy={busy}
							online={online}
							onAct={onAct}
						/>
					))}
				</div>
			)}
		</div>
	)
}

function ConfirmDialog({
	pending,
	busy,
	onCancel,
	onConfirm,
}: VoiceFeelConfirmDialogProps) {
	const revert = pending?.kind === "revert"
	const from = pending
		? knobValue(revert ? pending.adjustment.to : pending.adjustment.from)
		: ""
	const to = pending
		? knobValue(revert ? pending.adjustment.from : pending.adjustment.to)
		: ""
	return (
		<Dialog
			open={pending !== null}
			onOpenChange={(open) => {
				if (!open) onCancel()
			}}
		>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>
						{revert ? m.vf_confirm_revert_title() : m.vf_confirm_apply_title()}
					</DialogTitle>
					<DialogDescription>
						{pending
							? m.vf_confirm_desc({
									knob: knobLabel(pending.adjustment),
									from,
									to,
								})
							: ""}
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose
						render={<Button variant="ghost">{m.dlg_cancel()}</Button>}
					/>
					<Button disabled={busy} onClick={onConfirm}>
						{busy ? (
							<Loader2 className="size-4 animate-spin" />
						) : revert ? (
							<Undo2 className="size-4" />
						) : (
							<Check className="size-4" />
						)}
						{revert ? m.vf_revert() : m.vf_apply()}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

export function VoiceFeelCard({ domiaKey, online }: VoiceFeelCardProps) {
	const qc = useQueryClient()
	const [pending, setPending] = useState<PendingAction | null>(null)
	const { state } = useActionQuery({
		...voiceFeelQueryOptions(domiaKey),
		enabled: online,
		errorMessage: m.vf_failed,
	})

	const mutation = useActionMutation({
		mutationFn: (action: PendingAction) =>
			action.kind === "apply"
				? applyVoiceFeelFn({ data: { domiaKey, id: action.adjustment.id } })
				: revertVoiceFeelFn({ data: { domiaKey, id: action.adjustment.id } }),
		failureTitle: m.vf_action_failed,
		onDone: (data, action) => {
			const title =
				action.kind === "apply" ? m.vf_toast_applied() : m.vf_toast_reverted()
			const apply = data?.apply
			if (apply && applyNeedsAttention(apply))
				toast.warning(title, { description: summarizeApply(apply) })
			else toast.success(title, { description: knobLabel(action.adjustment) })
			setPending(null)
			void qc.invalidateQueries({ queryKey: ["voice-feel", domiaKey] })
			void qc.invalidateQueries({ queryKey: ["config", domiaKey] })
		},
	})

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<SlidersHorizontal className="size-4" />
					{m.vf_title()}
				</CardTitle>
				<p className="text-muted-foreground text-sm">{m.vf_desc()}</p>
			</CardHeader>
			<CardContent>
				{!online ? (
					<p className="text-muted-foreground text-sm">{m.health_offline()}</p>
				) : (
					<AsyncBoundary
						state={state}
						skeleton={<Skeleton className="h-32 w-full" />}
					>
						{(snapshot) =>
							snapshot ? (
								<VoiceFeelBody
									snapshot={snapshot}
									busy={mutation.isPending}
									online={online}
									onAct={setPending}
								/>
							) : (
								<p className="text-muted-foreground text-sm">{m.vf_empty()}</p>
							)
						}
					</AsyncBoundary>
				)}
			</CardContent>

			<ConfirmDialog
				pending={pending}
				busy={mutation.isPending}
				onCancel={() => setPending(null)}
				onConfirm={() => pending && mutation.mutate(pending)}
			/>
		</Card>
	)
}
