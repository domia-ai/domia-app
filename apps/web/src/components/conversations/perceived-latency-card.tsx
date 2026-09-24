import { m } from "@/paraglide/messages"
import { formatMs } from "@/utils/format"
import {
	buildPerceivedLadder,
	ratioOf,
	toPerceivedSource,
} from "@/utils/latency"
import {
	PERCEIVED_LADDER_LABELS,
	PERCEIVED_SECONDARY_FIELDS,
} from "@/constants/latency"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CopyButton } from "@/components/conversations/copy-button"
import { useActionQuery } from "@/hooks/use-query-state"
import { interactionLadderQueryOptions } from "@/server/latency"
import type {
	PerceivedLadderOrigin,
	PerceivedLatencyCardProps,
	PerceivedLatencySource,
} from "@/types/latency"
import type {
	PerceivedLadderProps,
	PerceivedSourceProps,
} from "@/types/conversations"

const ORIGIN_LABEL: Record<PerceivedLadderOrigin, () => string> = {
	live: m.ledger_source_live,
	archived: m.ledger_source_archived,
	unavailable: m.ledger_source_unavailable,
}

const numberField = (
	source: PerceivedLatencySource,
	field: keyof PerceivedLatencySource,
): number | null => {
	const value = source[field]
	return typeof value === "number" ? value : null
}

function Ladder({ ladder, source }: PerceivedLadderProps) {
	const start = ladder.steps[0].at
	return (
		<div className="space-y-2">
			<div className="flex items-baseline justify-between">
				<p className="text-sm font-medium">{m.ledger_ladder_title()}</p>
				<p className="font-mono text-sm tabular-nums">
					{formatMs(ladder.totalMs)}
				</p>
			</div>
			<ul className="space-y-1.5">
				{ladder.steps.map((step) => (
					<li key={step.key} className="space-y-1">
						<div className="flex items-baseline gap-2 text-sm">
							<span className="flex-1 truncate">
								{PERCEIVED_LADDER_LABELS[step.key]()}
							</span>
							<span className="text-muted-foreground font-mono text-xs tabular-nums">
								+{formatMs(step.at - start)}
							</span>
							<span className="w-16 text-right font-mono text-xs tabular-nums">
								{step.deltaMs == null ? "—" : formatMs(step.deltaMs)}
							</span>
						</div>
						{step.deltaMs != null && (
							<div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
								<div
									className="bg-primary h-full rounded-full"
									style={{ width: `${Math.min(100, step.pct)}%` }}
								/>
							</div>
						)}
					</li>
				))}
			</ul>
			{ladder.missing.length > 0 && (
				<p className="text-muted-foreground text-xs">
					{m.ledger_missing_steps({
						steps: ladder.missing
							.map((key) => PERCEIVED_LADDER_LABELS[key]())
							.join(", "),
					})}
				</p>
			)}
			{source.perceivedTtfaMs != null && (
				<p className="text-muted-foreground text-xs tabular-nums">
					{m.ledger_perceived_ttfa({
						value: formatMs(source.perceivedTtfaMs),
					})}
				</p>
			)}
		</div>
	)
}

function Chips({ source }: PerceivedSourceProps) {
	const chips = [
		{ label: m.ledger_chip_eou_delay(), value: source.eouDelayMs },
		{
			label: m.ledger_chip_transcription_delay(),
			value: source.transcriptionDelayMs,
		},
		{ label: m.ledger_chip_fast_path(), value: source.fastPathMs },
		{
			label: m.ledger_chip_endpoint_debounce(),
			value: source.endpointDebounceMs,
		},
	]
	return (
		<div className="flex flex-wrap gap-2">
			{chips.map((chip) => (
				<Badge key={chip.label} variant="secondary" className="gap-1.5">
					<span className="text-muted-foreground">{chip.label}</span>
					<span className="font-mono tabular-nums">{formatMs(chip.value)}</span>
				</Badge>
			))}
		</div>
	)
}

function CacheRatio({ source }: PerceivedSourceProps) {
	const cached = source.llmCachedTokens ?? 0
	const fresh = source.llmFreshTokens ?? 0
	const ratio = ratioOf(cached, cached + fresh)
	if (ratio == null) return null
	return (
		<div className="space-y-1">
			<div className="flex items-baseline justify-between text-sm">
				<span className="font-medium">{m.ledger_cache_title()}</span>
				<span className="font-mono tabular-nums">
					{Math.round(ratio * 100)}%
				</span>
			</div>
			<div className="bg-muted h-1.5 w-full overflow-hidden rounded-full">
				<div
					className="h-full rounded-full bg-emerald-500"
					style={{ width: `${ratio * 100}%` }}
				/>
			</div>
			<p className="text-muted-foreground text-xs tabular-nums">
				{m.ledger_cache_detail({ cached, fresh })}
			</p>
		</div>
	)
}

function HeardReply({ source }: PerceivedSourceProps) {
	const heard = source.heardReply
	const full = source.llmResponse
	if (!heard || !full || heard === full) return null
	const truncated = full.startsWith(heard)
	return (
		<div className="space-y-1">
			<p className="text-sm font-medium">{m.ledger_heard_title()}</p>
			{truncated ? (
				<p className="text-sm">
					{heard}
					<span className="text-muted-foreground/50">
						{full.slice(heard.length)}
					</span>
				</p>
			) : (
				<div className="space-y-1 text-sm">
					<p>{heard}</p>
					<p className="text-muted-foreground/50">{full}</p>
				</div>
			)}
			<p className="text-muted-foreground text-xs">{m.ledger_heard_hint()}</p>
		</div>
	)
}

function SecondaryRow({ source }: PerceivedSourceProps) {
	const cells = PERCEIVED_SECONDARY_FIELDS.map((entry) => ({
		label: entry.label(),
		value: numberField(source, entry.field),
	})).filter((cell) => cell.value != null)
	if (cells.length === 0) return null
	return (
		<div className="space-y-1.5">
			<p className="text-muted-foreground text-xs">
				{m.ledger_secondary_title()}
			</p>
			<div className="flex flex-wrap gap-2">
				{cells.map((cell) => (
					<Badge key={cell.label} variant="outline" className="gap-1.5">
						<span className="text-muted-foreground">{cell.label}</span>
						<span className="font-mono tabular-nums">
							{formatMs(cell.value)}
						</span>
					</Badge>
				))}
			</div>
		</div>
	)
}

export function PerceivedLatencyCard({ trace }: PerceivedLatencyCardProps) {
	const { state } = useActionQuery({
		...interactionLadderQueryOptions(trace.sourceDomiaKey, trace.id),
		errorMessage: m.ledger_live_error,
	})

	const liveSource = state.status === "ready" ? state.data : undefined
	const archivedSource = toPerceivedSource(trace)
	const live = liveSource
		? {
				origin: "live" as const,
				source: liveSource,
				ladder: buildPerceivedLadder(liveSource),
			}
		: null
	const archived = {
		origin: "archived" as const,
		source: archivedSource,
		ladder: buildPerceivedLadder(archivedSource),
	}
	const picked = live?.ladder
		? live
		: archived.ladder
			? archived
			: (live ?? archived)
	const origin: PerceivedLadderOrigin = picked.ladder
		? picked.origin
		: "unavailable"
	const source = picked.source

	return (
		<Card>
			<CardHeader className="flex flex-wrap items-center justify-between gap-2">
				<CardTitle className="text-base">{m.ledger_title()}</CardTitle>
				<div className="flex items-center gap-3">
					{source.traceId && (
						<CopyButton
							text={source.traceId}
							label={m.ledger_trace_id({ id: source.traceId.slice(0, 8) })}
						/>
					)}
					<Badge variant={origin === "live" ? "default" : "outline"}>
						{ORIGIN_LABEL[origin]()}
					</Badge>
				</div>
			</CardHeader>
			<CardContent className="space-y-4">
				{state.status === "error" && (
					<p className="text-muted-foreground text-xs">{state.message}</p>
				)}
				{picked.ladder ? (
					<Ladder ladder={picked.ladder} source={source} />
				) : (
					<p className="text-muted-foreground text-sm">
						{m.ledger_ladder_unavailable()}
					</p>
				)}
				<Chips source={source} />
				<CacheRatio source={source} />
				<HeardReply source={source} />
				{source.implicitFeedback && (
					<Badge variant="secondary">
						{m.ledger_implicit_feedback({ value: source.implicitFeedback })}
					</Badge>
				)}
				<SecondaryRow source={source} />
			</CardContent>
		</Card>
	)
}
