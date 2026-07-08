import { Link } from "@tanstack/react-router"
import { Cpu, Download, Network, Rabbit, Turtle } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AnalyticsCharts } from "@/components/analytics/analytics-charts"
import { AnalyticsTokens } from "@/components/analytics/analytics-tokens"
import {
	DomiaChart,
	FlowChart,
	LatencyChart,
	ModelChart,
} from "@/components/analytics/analytics-breakdowns"
import { WaterfallPanel } from "@/components/analytics/waterfall"
import { formatMs } from "@/utils/format"
import type {
	AnalyticsData,
	ExecutionLatencyRow,
	ExemplarRow,
} from "@/types/analytics"

function ExecutionCard({ row }: { row: ExecutionLatencyRow }) {
	const local = row.kind === "local"
	return (
		<div className="bg-card rounded-lg border p-4">
			<div className="flex items-center gap-2">
				{local ? (
					<Cpu className="text-muted-foreground size-4" />
				) : (
					<Network className="text-muted-foreground size-4" />
				)}
				<span className="font-medium">
					{local ? m.analytics_on_device() : m.analytics_delegated_grpc()}
				</span>
				<Badge variant="secondary" className="ml-auto text-[11px] tabular-nums">
					{row.count}
				</Badge>
			</div>
			<div className="mt-3 grid grid-cols-2 gap-3">
				<div>
					<p className="text-muted-foreground text-xs">
						{m.analytics_ttfa_p50()}
					</p>
					<p className="text-xl font-semibold tabular-nums">
						{formatMs(row.ttfa.p50)}
					</p>
					<p className="text-muted-foreground text-xs tabular-nums">
						p95 {formatMs(row.ttfa.p95)}
					</p>
				</div>
				<div>
					<p className="text-muted-foreground text-xs">
						{m.analytics_total_p50()}
					</p>
					<p className="text-xl font-semibold tabular-nums">
						{formatMs(row.total.p50)}
					</p>
					<p className="text-muted-foreground text-xs tabular-nums">
						p95 {formatMs(row.total.p95)}
					</p>
				</div>
			</div>
		</div>
	)
}

function ExemplarCard({
	row,
	kind,
}: {
	row: ExemplarRow
	kind: "fastest" | "slowest"
}) {
	const fast = kind === "fastest"
	return (
		<Link
			to="/conversations/$id"
			params={{ id: row.id }}
			className="hover:bg-muted/50 block rounded-lg border p-4 transition-colors"
		>
			<div className="flex items-center gap-2">
				{fast ? (
					<Rabbit className="text-muted-foreground size-4" />
				) : (
					<Turtle className="text-muted-foreground size-4" />
				)}
				<span className="font-medium">
					{fast ? m.analytics_fastest() : m.analytics_slowest()}
				</span>
				<Badge variant="outline" className="text-[11px] uppercase">
					{row.flow}
				</Badge>
				<span className="ml-auto font-mono text-lg font-semibold tabular-nums">
					{formatMs(row.ttfaMs)}
				</span>
			</div>
			<p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
				&ldquo;{row.input}&rdquo;
			</p>
			<p className="text-muted-foreground mt-1 text-xs">
				{m.analytics_exemplar_total({
					domia: row.domia,
					total: formatMs(row.totalMs),
				})}
			</p>
		</Link>
	)
}

export function AnalyticsView({ data }: { data: AnalyticsData }) {
	if (data.total === 0) {
		return (
			<Card>
				<CardContent className="text-muted-foreground py-12 text-center text-sm">
					{m.analytics_no_interactions()}
				</CardContent>
			</Card>
		)
	}

	return (
		<>
			<section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				<div className="bg-primary/5 border-primary/20 rounded-lg border p-4">
					<p className="text-muted-foreground text-xs">
						{m.analytics_s2s_ttfa()}
					</p>
					<p className="text-primary mt-1 text-3xl font-bold tabular-nums">
						{formatMs(data.hero.s2sTtfaP50)}
					</p>
					<p className="text-muted-foreground mt-0.5 text-xs">
						{m.analytics_s2s_ttfa_sub()}
					</p>
				</div>
				<div className="bg-card rounded-lg border p-4">
					<p className="text-muted-foreground text-xs">
						{m.analytics_interactions()}
					</p>
					<p className="mt-1 text-3xl font-bold tabular-nums">
						{data.hero.total}
					</p>
					<p className="text-muted-foreground mt-0.5 text-xs">
						{m.analytics_across_flows({ count: data.hero.flows })}
					</p>
				</div>
				<div className="bg-card rounded-lg border p-4">
					<p className="text-muted-foreground text-xs">
						{m.analytics_on_device()}
					</p>
					<p className="mt-1 text-3xl font-bold tabular-nums">
						{data.hero.onDevicePct == null ? "—" : `${data.hero.onDevicePct}%`}
					</p>
					<p className="text-muted-foreground mt-0.5 text-xs">
						{m.analytics_on_device_sub()}
					</p>
				</div>
				<div className="bg-card rounded-lg border p-4">
					<p className="text-muted-foreground text-xs">
						{m.analytics_eval_corpus()}
					</p>
					<p className="mt-1 text-3xl font-bold tabular-nums">
						{data.corpus.graded}
					</p>
					<p className="text-muted-foreground mt-0.5 text-xs">
						{m.analytics_corpus_sub({
							up: data.corpus.up,
							down: data.corpus.down,
						})}
					</p>
				</div>
			</section>

			{data.waterfall && <WaterfallPanel data={data.waterfall} />}

			<AnalyticsCharts
				timeSeries={data.timeSeries}
				histogram={data.histogram}
			/>

			<AnalyticsTokens
				tokens={data.tokens}
				ttftHistogram={data.ttftHistogram}
				tools={data.tools}
				sources={data.sources}
				avgInputAudioMs={data.avgInputAudioMs}
			/>

			{data.execution.length > 0 && (
				<section className="space-y-3">
					<h2 className="text-sm font-medium">
						{m.analytics_on_device_vs_delegated()}
					</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{data.execution.map((e) => (
							<ExecutionCard key={e.kind} row={e} />
						))}
					</div>
				</section>
			)}

			{(data.exemplars.fastest || data.exemplars.slowest) && (
				<section className="grid gap-3 sm:grid-cols-2">
					{data.exemplars.fastest && (
						<ExemplarCard row={data.exemplars.fastest} kind="fastest" />
					)}
					{data.exemplars.slowest && (
						<ExemplarCard row={data.exemplars.slowest} kind="slowest" />
					)}
				</section>
			)}

			<FlowChart rows={data.byFlow} />

			<LatencyChart rows={data.latency} />

			<div className="grid gap-4 lg:grid-cols-2">
				<ModelChart rows={data.modelPerf} />
				<DomiaChart rows={data.byDomia} />
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">
						{m.analytics_eval_corpus()}
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="bg-card rounded-lg border p-3">
							<p className="text-muted-foreground text-xs">
								{m.analytics_graded()}
							</p>
							<p className="text-xl font-semibold tabular-nums">
								{data.corpus.graded}
							</p>
						</div>
						<div className="bg-card rounded-lg border p-3">
							<p className="text-muted-foreground text-xs">
								{m.analytics_good()}
							</p>
							<p className="text-xl font-semibold tabular-nums">
								{data.corpus.up}
							</p>
						</div>
						<div className="bg-card rounded-lg border p-3">
							<p className="text-muted-foreground text-xs">
								{m.analytics_needs_work()}
							</p>
							<p className="text-xl font-semibold tabular-nums">
								{data.corpus.down}
							</p>
						</div>
						<div className="bg-card rounded-lg border p-3">
							<p className="text-muted-foreground text-xs">
								{m.analytics_tagged()}
							</p>
							<p className="text-xl font-semibold tabular-nums">
								{data.corpus.tagged}
							</p>
						</div>
					</div>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={<a href="/api/conversations/export?rating=up" download />}
						>
							<Download className="size-3.5" />
							{m.analytics_export_good()}
						</Button>
						<Button
							variant="outline"
							size="sm"
							nativeButton={false}
							render={
								<a href="/api/conversations/export?rating=down" download />
							}
						>
							<Download className="size-3.5" />
							{m.analytics_export_needs_work()}
						</Button>
					</div>
				</CardContent>
			</Card>
		</>
	)
}
