import { useState } from "react"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"
import { formatMs } from "@/utils/format"
import { latencyBand, ratioOf } from "@/utils/latency"
import {
	BARGE_IN_RECOVERY_GOOD,
	BARGE_IN_RECOVERY_WARN,
	LATENCY_BAND_CLASS,
	LATENCY_SAMPLE_WINDOW,
	LATENCY_STAGES,
	SPECULATION_WASTE_GOOD,
	SPECULATION_WASTE_WARN,
	TWO_TIER_REUSE_GOOD,
	TWO_TIER_REUSE_WARN,
	WAKE_VERIFIER_REJECT_GOOD,
	WAKE_VERIFIER_REJECT_WARN,
} from "@/constants/latency"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { useActionQuery, useDataQuery } from "@/hooks/use-query-state"
import { latencyStatsQueryOptions } from "@/server/latency"
import { domiaTargetsQueryOptions } from "@/server/fleet"
import type {
	LatencyStatsSectionProps,
	LatencyStatsViewProps,
	LiveNodeMetricsBodyProps,
} from "@/types/analytics"
import type {
	LatencyPercentiles,
	LatencyRatioTile,
	LatencyStageUnit,
	LatencyStatsSummary,
} from "@/types/latency"

const percent = (value: number | null): string =>
	value == null ? "—" : `${Math.round(value * 100)}%`

const formatMb = (value: number | null): string =>
	value == null ? "—" : `${Math.round(value)} MB`

const formatStage = (value: number | null, unit: LatencyStageUnit): string =>
	unit === "mb" ? formatMb(value) : formatMs(value)

const ratioTiles = (stats: LatencyStatsSummary): LatencyRatioTile[] => {
	const { speculation, bargeIn, twoTier, wakeVerifier } = stats
	const reuse = ratioOf(twoTier.reused, twoTier.prefills)
	const spec = speculation.handedOff + speculation.discarded
	const barge = bargeIn.resumed + bargeIn.escalated
	const wake = wakeVerifier.accepted + wakeVerifier.rejected
	return [
		{
			key: "speculation",
			label: m.lat_ratio_speculation(),
			hint: m.lat_ratio_speculation_hint(),
			value: spec > 0 ? speculation.wasteRate : null,
			band: latencyBand(
				spec > 0 ? speculation.wasteRate : null,
				SPECULATION_WASTE_GOOD,
				SPECULATION_WASTE_WARN,
				false,
			),
			detail: m.lat_ratio_speculation_detail({
				handedOff: speculation.handedOff,
				discarded: speculation.discarded,
				wasted: speculation.wastedFirstUnit,
			}),
		},
		{
			key: "bargeIn",
			label: m.lat_ratio_barge_in(),
			hint: m.lat_ratio_barge_in_hint(),
			value: barge > 0 ? bargeIn.recoveryRate : null,
			band: latencyBand(
				barge > 0 ? bargeIn.recoveryRate : null,
				BARGE_IN_RECOVERY_GOOD,
				BARGE_IN_RECOVERY_WARN,
				true,
			),
			detail: m.lat_ratio_barge_in_detail({
				resumed: bargeIn.resumed,
				escalated: bargeIn.escalated,
			}),
		},
		{
			key: "twoTier",
			label: m.lat_ratio_two_tier(),
			hint: m.lat_ratio_two_tier_hint(),
			value: reuse,
			band: latencyBand(reuse, TWO_TIER_REUSE_GOOD, TWO_TIER_REUSE_WARN, true),
			detail: m.lat_ratio_two_tier_detail({
				prefills: twoTier.prefills,
				reused: twoTier.reused,
				cancelled: twoTier.cancelled,
				reprefilled: twoTier.reprefilled,
			}),
		},
		{
			key: "wakeVerifier",
			label: m.lat_ratio_wake_verifier(),
			hint: m.lat_ratio_wake_verifier_hint(),
			value: wake > 0 ? wakeVerifier.rejectRate : null,
			band: latencyBand(
				wake > 0 ? wakeVerifier.rejectRate : null,
				WAKE_VERIFIER_REJECT_GOOD,
				WAKE_VERIFIER_REJECT_WARN,
				false,
			),
			detail: m.lat_ratio_wake_verifier_detail({
				accepted: wakeVerifier.accepted,
				rejected: wakeVerifier.rejected,
				failedOpen: wakeVerifier.failedOpen,
			}),
		},
	]
}

function SpeculationCards({ stats }: LatencyStatsSectionProps) {
	return (
		<div className="space-y-2">
			<div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
				{ratioTiles(stats).map((tile) => (
					<div
						key={tile.key}
						className={cn(
							"rounded-lg border p-3",
							LATENCY_BAND_CLASS[tile.band],
						)}
						title={tile.hint}
					>
						<p className="text-muted-foreground text-xs">{tile.label}</p>
						<p className="text-xl font-semibold tabular-nums">
							{percent(tile.value)}
						</p>
						<p className="text-muted-foreground mt-0.5 text-xs tabular-nums">
							{tile.detail}
						</p>
					</div>
				))}
			</div>
			<p className="text-muted-foreground text-xs">{m.lat_since_boot()}</p>
		</div>
	)
}

function PercentileTable({ stats }: LatencyStatsSectionProps) {
	return (
		<div className="overflow-x-auto">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>{m.lat_col_stage()}</TableHead>
						<TableHead className="text-right">{m.lat_col_p50()}</TableHead>
						<TableHead className="text-right">{m.lat_col_p90()}</TableHead>
						<TableHead className="text-right">{m.lat_col_min()}</TableHead>
						<TableHead className="text-right">{m.lat_col_max()}</TableHead>
						<TableHead className="text-right">{m.lat_col_count()}</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{LATENCY_STAGES.map((stage) => {
						const row: LatencyPercentiles = stats.stages[stage.key]
						return (
							<TableRow key={stage.key}>
								<TableCell className="font-medium">{stage.label()}</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatStage(row.p50, stage.unit)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatStage(row.p90, stage.unit)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatStage(row.min, stage.unit)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatStage(row.max, stage.unit)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{row.count}
								</TableCell>
							</TableRow>
						)
					})}
				</TableBody>
			</Table>
		</div>
	)
}

function SatelliteTable({ view }: LatencyStatsViewProps) {
	if (view.satellites.length === 0) return null
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">{m.lat_by_satellite()}</p>
			<div className="overflow-x-auto">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{m.lat_col_satellite()}</TableHead>
							<TableHead className="text-right">{m.lat_col_p50()}</TableHead>
							<TableHead className="text-right">{m.lat_col_p90()}</TableHead>
							<TableHead className="text-right">{m.lat_col_max()}</TableHead>
							<TableHead className="text-right">{m.lat_col_count()}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{view.satellites.map((sat) => (
							<TableRow key={sat.satelliteId}>
								<TableCell className="font-medium">{sat.name}</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatMs(sat.percentiles.p50)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatMs(sat.percentiles.p90)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{formatMs(sat.percentiles.max)}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{sat.percentiles.count}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			<p className="text-muted-foreground text-xs">
				{m.lat_by_satellite_hint()}
			</p>
		</div>
	)
}

export function LatencyStatsBody({ view }: LatencyStatsViewProps) {
	if (view.stats.sampleSize === 0)
		return (
			<div className="space-y-4">
				<p className="text-muted-foreground text-sm">{m.lat_no_samples()}</p>
				<SpeculationCards stats={view.stats} />
			</div>
		)
	return (
		<div className="space-y-4">
			<p className="text-muted-foreground text-xs">
				{m.lat_sample_window({
					count: view.stats.sampleSize,
					window: LATENCY_SAMPLE_WINDOW,
				})}
			</p>
			<PercentileTable stats={view.stats} />
			<SpeculationCards stats={view.stats} />
			<SatelliteTable view={view} />
		</div>
	)
}

export function LiveNodeMetrics() {
	const [selected, setSelected] = useState<string | null>(null)
	const { state: targetsState } = useDataQuery({
		...domiaTargetsQueryOptions(),
		errorMessage: m.lat_targets_error,
	})
	const targets = targetsState.status === "ready" ? targetsState.data : []
	const domiaKey = selected ?? targets[0]?.domiaKey ?? null

	return (
		<Card>
			<CardHeader className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-1">
					<CardTitle className="text-base">{m.lat_live_title()}</CardTitle>
					<p className="text-muted-foreground text-sm">
						{m.lat_live_description()}
					</p>
				</div>
				{targetsState.status === "error" ? (
					<p className="text-destructive text-sm">{targetsState.message}</p>
				) : (
					<Select
						value={domiaKey ?? ""}
						onValueChange={(value) => value && setSelected(value)}
						items={targets.map((t) => ({ value: t.domiaKey, label: t.name }))}
					>
						<SelectTrigger className="h-9 w-56">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{targets.map((t) => (
								<SelectItem key={t.domiaKey} value={t.domiaKey}>
									{t.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</CardHeader>
			<CardContent>
				{domiaKey ? (
					<LiveNodeMetricsBody domiaKey={domiaKey} />
				) : (
					<p className="text-muted-foreground text-sm">{m.lat_no_targets()}</p>
				)}
			</CardContent>
		</Card>
	)
}

function LiveNodeMetricsBody({ domiaKey }: LiveNodeMetricsBodyProps) {
	const { state } = useActionQuery({
		...latencyStatsQueryOptions(domiaKey),
		errorMessage: m.lat_load_error,
	})
	return (
		<AsyncBoundary
			state={state}
			skeleton={
				<div className="space-y-3">
					<Skeleton className="h-40 w-full" />
					<Skeleton className="h-20 w-full" />
				</div>
			}
		>
			{(view) =>
				view ? (
					<LatencyStatsBody view={view} />
				) : (
					<p className="text-muted-foreground text-sm">{m.lat_load_error()}</p>
				)
			}
		</AsyncBoundary>
	)
}
