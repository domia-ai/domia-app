import { Bar, BarChart } from "recharts"
import { m } from "@/paraglide/messages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart"
import { WaterfallPanel } from "@/components/analytics/waterfall"
import { formatMs } from "@/utils/format"
import type { DomiaPerformance } from "@/types/fleet"

const STAGE_LABEL: Record<string, string> = {
	stt: "STT",
	llm: "LLM",
	tts: "TTS",
}

const trendConfig = () =>
	({
		count: { label: m.ov_interactions(), color: "var(--chart-2)" },
	}) satisfies ChartConfig

export function PerformanceCard({ data }: { data: DomiaPerformance }) {
	if (data.count === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{m.ov_performance()}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">
						{m.perf_no_interactions()}
					</p>
				</CardContent>
			</Card>
		)
	}

	const trend = data.trend.slice(-14)

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle className="text-base">{m.ov_performance()}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
						<div className="rounded-lg border p-3">
							<p className="text-muted-foreground text-xs">
								{m.ov_first_audio_p50()}
							</p>
							<p className="text-xl font-semibold tabular-nums">
								{formatMs(data.ttfa.p50)}
							</p>
							<p className="text-muted-foreground text-xs tabular-nums">
								{m.ov_hint_p95({ value: formatMs(data.ttfa.p95) })}
							</p>
						</div>
						<div className="rounded-lg border p-3">
							<p className="text-muted-foreground text-xs">
								{m.perf_total_p50()}
							</p>
							<p className="text-xl font-semibold tabular-nums">
								{formatMs(data.total.p50)}
							</p>
							<p className="text-muted-foreground text-xs tabular-nums">
								{m.ov_hint_p95({ value: formatMs(data.total.p95) })}
							</p>
						</div>
						<div className="rounded-lg border p-3">
							<p className="text-muted-foreground text-xs">
								{m.ov_interactions()}
							</p>
							<p className="text-xl font-semibold tabular-nums">{data.count}</p>
						</div>
						<div className="rounded-lg border p-3">
							<p className="text-muted-foreground text-xs">
								{m.perf_execution()}
							</p>
							<p className="text-sm font-semibold tabular-nums">
								{m.perf_local_count({ count: data.execution.localCount })}
							</p>
							<p className="text-muted-foreground text-xs tabular-nums">
								{m.perf_delegated_count({
									count: data.execution.delegatedCount,
								})}
							</p>
						</div>
					</div>

					{trend.length > 1 && (
						<ChartContainer config={trendConfig()} className="h-24 w-full">
							<BarChart data={trend} accessibilityLayer>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar dataKey="count" fill="var(--color-count)" radius={3} />
							</BarChart>
						</ChartContainer>
					)}

					{data.topModels.length > 0 && (
						<div className="space-y-2">
							{data.topModels.map((m, i) => (
								<div
									key={`${m.stage}-${m.model}-${i}`}
									className="flex items-center gap-3 text-sm"
								>
									<Badge variant="secondary" className="text-[11px]">
										{STAGE_LABEL[m.stage]}
									</Badge>
									<span className="flex-1 truncate font-mono text-xs">
										{m.model}
									</span>
									<span className="text-muted-foreground tabular-nums">
										{m.count}×
									</span>
									<span className="text-muted-foreground w-14 text-right font-mono tabular-nums">
										{formatMs(m.avgMs)}
									</span>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			{data.waterfall && (
				<WaterfallPanel
					data={data.waterfall}
					title={m.perf_waterfall_title()}
				/>
			)}
		</>
	)
}
