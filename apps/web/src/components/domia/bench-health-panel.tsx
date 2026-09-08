import { useMutation } from "@tanstack/react-query"
import {
	Activity,
	CheckCircle2,
	Loader2,
	TriangleAlert,
	XCircle,
} from "lucide-react"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { runBenchFn } from "@/server/bench"
import type { BenchRunResult, BenchTurnRow, BenchVerdict } from "@/types/bench"

const STAGE_LABEL: Record<string, () => string> = {
	stt_ms: () => m.bench_stage_stt(),
	llm_ttft_ms: () => m.bench_stage_llm_ttft(),
	llm_ms: () => m.bench_stage_llm(),
	tts_ms: () => m.bench_stage_tts(),
	tool_ms: () => m.bench_stage_tool(),
	total_ms: () => m.bench_stage_total(),
}

const stageLabel = (stage: string): string => STAGE_LABEL[stage]?.() ?? stage

const ROW_STATUS_LABEL: Record<BenchTurnRow["status"], () => string> = {
	ok: m.bench_verdict_ok,
	failed: m.bench_row_failed,
	skipped: m.bench_row_skipped,
}

const ms = (value: number | null): string =>
	value == null ? "—" : `${Math.round(value)} ms`

function VerdictBadge({ verdict }: { verdict: BenchVerdict }) {
	if (verdict === "ok")
		return (
			<Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
				<CheckCircle2 className="size-3.5" />
				{m.bench_verdict_ok()}
			</Badge>
		)
	if (verdict === "slow")
		return (
			<Badge className="gap-1 bg-amber-500 text-white hover:bg-amber-500">
				<TriangleAlert className="size-3.5" />
				{m.bench_verdict_slow()}
			</Badge>
		)
	return (
		<Badge variant="destructive" className="gap-1">
			<XCircle className="size-3.5" />
			{m.bench_verdict_failed()}
		</Badge>
	)
}

function BenchResult({ result }: { result: BenchRunResult }) {
	const missing = result.health.entries.filter((e) => e.status === "missing")
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				<VerdictBadge verdict={result.verdict} />
				{result.health.ok ? (
					<Badge variant="secondary" className="gap-1">
						<CheckCircle2 className="size-3.5" />
						{m.bench_health_ok()}
					</Badge>
				) : (
					<Badge variant="destructive" className="gap-1">
						<XCircle className="size-3.5" />
						{m.bench_health_missing({ count: String(missing.length) })}
					</Badge>
				)}
				<span className="text-muted-foreground text-xs">
					{m.bench_summary({
						hardware: result.hardware.hardwareLabel,
						hardwareClass: result.hardware.hardwareClass,
						completed: String(result.turns.completed),
						requested: String(result.turns.requested),
						seconds: (result.durationMs / 1000).toFixed(1),
					})}
				</span>
			</div>
			<div className="overflow-x-auto rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>{m.bench_col_stage()}</TableHead>
							<TableHead className="text-right">{m.bench_col_p50()}</TableHead>
							<TableHead className="text-right">{m.bench_col_p95()}</TableHead>
							<TableHead className="text-right">{m.bench_col_max()}</TableHead>
							<TableHead>{m.bench_col_verdict()}</TableHead>
							<TableHead>{m.bench_col_suggestion()}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{result.stages.map((stage) => (
							<TableRow key={stage.stage}>
								<TableCell className="font-medium">
									{stageLabel(stage.stage)}
								</TableCell>
								<TableCell className="text-right font-mono text-xs">
									{ms(stage.p50)}
								</TableCell>
								<TableCell className="text-right font-mono text-xs">
									{ms(stage.p95)}
								</TableCell>
								<TableCell className="text-muted-foreground text-right font-mono text-xs">
									{ms(stage.thresholdMs)}
								</TableCell>
								<TableCell>
									<VerdictBadge verdict={stage.verdict} />
								</TableCell>
								<TableCell className="text-muted-foreground max-w-xs text-xs">
									{stage.suggestion ?? ""}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
			{result.rows.some((r) => r.status !== "ok") && (
				<ul className="text-muted-foreground space-y-0.5 text-xs">
					{result.rows
						.filter((r) => r.status !== "ok")
						.map((r) => (
							<li key={r.id}>
								<span className="font-mono">{r.id}</span> ·{" "}
								{ROW_STATUS_LABEL[r.status]()}
								{r.error ? ` · ${r.error}` : ""}
							</li>
						))}
				</ul>
			)}
		</div>
	)
}

export function BenchHealthPanel({
	domiaKey,
	online,
}: {
	domiaKey: string
	online: boolean
}) {
	const mutation = useMutation({
		mutationFn: () => runBenchFn({ data: { domiaKey } }),
	})
	const result = mutation.data

	return (
		<div className="space-y-3 rounded-lg border p-4">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-0.5">
					<h3 className="text-sm font-semibold">{m.bench_title()}</h3>
					<p className="text-muted-foreground text-xs">{m.bench_desc()}</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					disabled={!online || mutation.isPending}
					onClick={() => mutation.mutate()}
				>
					{mutation.isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Activity className="size-4" />
					)}
					{mutation.isPending ? m.bench_running() : m.bench_run()}
				</Button>
			</div>
			{!online && (
				<p className="text-muted-foreground text-sm">{m.health_offline()}</p>
			)}
			{mutation.isError && (
				<p className="text-destructive text-sm">{m.bench_failed()}</p>
			)}
			{result && !result.ok && (
				<p className="text-destructive text-sm">{errText(result.error)}</p>
			)}
			{result?.ok && result.data && <BenchResult result={result.data} />}
		</div>
	)
}
