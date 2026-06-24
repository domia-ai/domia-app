import {
	Bar,
	BarChart,
	CartesianGrid,
	Cell,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from "recharts"
import { AudioLines, Coins, Wrench } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart"
import { formatMs } from "@/utils/format"
import type {
	HistogramBin,
	SourceRow,
	TokenStats,
	ToolStats,
} from "@/types/analytics"

const tpsConfig = {
	tokensPerSec: { label: "tok/s", color: "var(--chart-1)" },
} satisfies ChartConfig

const tokConfig = {
	promptTokens: { label: "Prompt", color: "var(--chart-2)" },
	completionTokens: { label: "Completion", color: "var(--chart-3)" },
} satisfies ChartConfig

const ttftConfig = {
	count: { label: "Turns", color: "var(--chart-1)" },
} satisfies ChartConfig

const SOURCE_LABEL: Record<string, string> = {
	"local mic": "Local mic",
	esphome: "ESPHome",
	wyoming: "Wyoming",
	native: "Native",
}

function Stat({
	label,
	value,
	sub,
}: {
	label: string
	value: string
	sub?: string
}) {
	return (
		<div className="bg-card rounded-lg border p-4">
			<p className="text-muted-foreground text-xs">{label}</p>
			<p className="text-2xl font-semibold tabular-nums">{value}</p>
			{sub ? (
				<p className="text-muted-foreground text-xs tabular-nums">{sub}</p>
			) : null}
		</div>
	)
}

export function AnalyticsTokens({
	tokens,
	ttftHistogram,
	tools,
	sources,
	avgInputAudioMs,
}: {
	tokens: TokenStats
	ttftHistogram: HistogramBin[]
	tools: ToolStats
	sources: SourceRow[]
	avgInputAudioMs: number | null
}) {
	const totalTurns = sources.reduce((s, r) => s + r.count, 0)
	const SOURCE_COLORS = [
		"var(--chart-1)",
		"var(--chart-2)",
		"var(--chart-3)",
		"var(--chart-4)",
		"var(--chart-5)",
	]
	const pieData = sources.map((s, i) => ({
		name: SOURCE_LABEL[s.source] ?? s.source,
		value: s.count,
		fill: SOURCE_COLORS[i % SOURCE_COLORS.length],
	}))
	const sourceConfig: ChartConfig = Object.fromEntries(
		pieData.map((d) => [d.name, { label: d.name, color: d.fill }]),
	)
	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Coins className="text-muted-foreground size-4" />
				<h2 className="text-lg font-semibold">Tokens &amp; throughput</h2>
				<Badge variant="secondary" className="text-[11px] tabular-nums">
					{tokens.turns} turns
				</Badge>
			</div>

			<div className="grid gap-3 sm:grid-cols-4">
				<Stat
					label="Avg throughput"
					value={
						tokens.avgTokensPerSec != null
							? `${tokens.avgTokensPerSec} tok/s`
							: "—"
					}
				/>
				<Stat
					label="Avg prompt"
					value={
						tokens.avgPromptTokens != null
							? `${tokens.avgPromptTokens} tok`
							: "—"
					}
				/>
				<Stat
					label="Avg completion"
					value={
						tokens.avgCompletionTokens != null
							? `${tokens.avgCompletionTokens} tok`
							: "—"
					}
				/>
				<Stat
					label="Context used"
					value={
						tokens.avgContextPct != null ? `${tokens.avgContextPct}%` : "—"
					}
				/>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="text-base">Throughput by model</CardTitle>
					</CardHeader>
					<CardContent>
						{tokens.byModel.length ? (
							<ChartContainer config={tpsConfig} className="h-52 w-full">
								<BarChart data={tokens.byModel} accessibilityLayer>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="model"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis tickLine={false} axisLine={false} width={36} />
									<ChartTooltip content={<ChartTooltipContent />} />
									<Bar
										dataKey="tokensPerSec"
										fill="var(--color-tokensPerSec)"
										radius={4}
									/>
								</BarChart>
							</ChartContainer>
						) : (
							<p className="text-muted-foreground py-12 text-center text-sm">
								No token data yet.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Prompt vs completion</CardTitle>
					</CardHeader>
					<CardContent>
						{tokens.byModel.length ? (
							<ChartContainer config={tokConfig} className="h-52 w-full">
								<BarChart data={tokens.byModel} accessibilityLayer>
									<CartesianGrid vertical={false} />
									<XAxis
										dataKey="model"
										tickLine={false}
										axisLine={false}
										tickMargin={8}
									/>
									<YAxis
										tickLine={false}
										axisLine={false}
										width={36}
										allowDecimals={false}
									/>
									<ChartTooltip content={<ChartTooltipContent />} />
									<ChartLegend content={<ChartLegendContent />} />
									<Bar
										dataKey="promptTokens"
										fill="var(--color-promptTokens)"
										radius={4}
									/>
									<Bar
										dataKey="completionTokens"
										fill="var(--color-completionTokens)"
										radius={4}
									/>
								</BarChart>
							</ChartContainer>
						) : (
							<p className="text-muted-foreground py-12 text-center text-sm">
								No token data yet.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">TTFT distribution</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={ttftConfig} className="h-52 w-full">
							<BarChart data={ttftHistogram} accessibilityLayer>
								<CartesianGrid vertical={false} />
								<XAxis
									dataKey="label"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
								/>
								<YAxis
									tickLine={false}
									axisLine={false}
									width={28}
									allowDecimals={false}
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar dataKey="count" fill="var(--color-count)" radius={4} />
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			</div>

			<div className="grid gap-4 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Wrench className="text-muted-foreground size-4" /> Skills &amp;
							tools
						</CardTitle>
					</CardHeader>
					<CardContent>
						{tools.totalCalls > 0 ? (
							<div className="grid grid-cols-3 gap-3">
								<Stat
									label="Turns w/ tools"
									value={
										tools.withToolsPct != null ? `${tools.withToolsPct}%` : "—"
									}
									sub={`${tools.turnsWithTools} turns`}
								/>
								<Stat label="Tool calls" value={String(tools.totalCalls)} />
								<Stat
									label="Error rate"
									value={tools.errorRate != null ? `${tools.errorRate}%` : "—"}
								/>
							</div>
						) : (
							<p className="text-muted-foreground py-10 text-center text-sm">
								No skill/tool calls recorded yet.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Turns by source</CardTitle>
					</CardHeader>
					<CardContent>
						{pieData.length ? (
							<div className="flex items-center gap-4">
								<ChartContainer
									config={sourceConfig}
									className="aspect-square h-36"
								>
									<PieChart>
										<ChartTooltip
											content={<ChartTooltipContent nameKey="name" hideLabel />}
										/>
										<Pie
											data={pieData}
											dataKey="value"
											nameKey="name"
											innerRadius={36}
											strokeWidth={2}
										>
											{pieData.map((d) => (
												<Cell key={d.name} fill={d.fill} />
											))}
										</Pie>
									</PieChart>
								</ChartContainer>
								<div className="flex-1 space-y-1.5">
									{pieData.map((d) => (
										<div
											key={d.name}
											className="flex items-center gap-2 text-sm"
										>
											<span
												className="size-2.5 rounded-sm"
												style={{ background: d.fill }}
											/>
											<span className="flex-1 truncate">{d.name}</span>
											<span className="text-muted-foreground tabular-nums">
												{totalTurns
													? `${Math.round((d.value / totalTurns) * 100)}%`
													: ""}
											</span>
										</div>
									))}
								</div>
							</div>
						) : (
							<p className="text-muted-foreground py-10 text-center text-sm">
								No turns yet.
							</p>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<AudioLines className="text-muted-foreground size-4" /> Spoken
							input
						</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground text-xs">
							Avg utterance length
						</p>
						<p className="text-2xl font-semibold tabular-nums">
							{formatMs(avgInputAudioMs)}
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	)
}
