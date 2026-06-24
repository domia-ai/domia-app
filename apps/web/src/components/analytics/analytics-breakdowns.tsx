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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	ChartLegend,
	ChartLegendContent,
	type ChartConfig,
} from "@/components/ui/chart"
import type {
	DomiaLatencyRow,
	FlowLatencyRow,
	LatencyDistRow,
	StagePerfRow,
} from "@/types/analytics"

const FLOW_LABEL: Record<string, string> = {
	s2s: "Speech → Speech",
	t2s: "Text → Speech",
	v2t: "Voice → Text",
	t2t: "Text → Text",
}
const STAGE_LABEL: Record<string, string> = {
	stt: "STT",
	llm: "LLM",
	tts: "TTS",
}

const DONUT_COLORS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
]
const flowConfig = {
	p50: { label: "TTFA p50 (ms)", color: "var(--chart-2)" },
	p95: { label: "TTFA p95 (ms)", color: "var(--chart-4)" },
} satisfies ChartConfig
const modelConfig = {
	avgMs: { label: "Avg (ms)", color: "var(--chart-3)" },
} satisfies ChartConfig

const latConfig = {
	p50: { label: "p50 (ms)", color: "var(--chart-2)" },
	p95: { label: "p95 (ms)", color: "var(--chart-4)" },
} satisfies ChartConfig

const chartHeight = (n: number) => Math.max(140, n * 36 + 24)

export function LatencyChart({ rows }: { rows: LatencyDistRow[] }) {
	const data = rows.map((l) => ({
		name: l.label,
		p50: l.p50 ?? 0,
		p95: l.p95 ?? 0,
	}))
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Latency breakdown</CardTitle>
			</CardHeader>
			<CardContent>
				<ChartContainer
					config={latConfig}
					className="w-full"
					style={{ height: chartHeight(data.length * 2) }}
				>
					<BarChart
						data={data}
						layout="vertical"
						accessibilityLayer
						margin={{ left: 8, right: 12 }}
					>
						<CartesianGrid horizontal={false} />
						<XAxis type="number" tickLine={false} axisLine={false} />
						<YAxis
							type="category"
							dataKey="name"
							tickLine={false}
							axisLine={false}
							width={132}
						/>
						<ChartTooltip content={<ChartTooltipContent />} />
						<ChartLegend content={<ChartLegendContent />} />
						<Bar dataKey="p50" fill="var(--color-p50)" radius={4} />
						<Bar dataKey="p95" fill="var(--color-p95)" radius={4} />
					</BarChart>
				</ChartContainer>
			</CardContent>
		</Card>
	)
}

export function DomiaChart({ rows }: { rows: DomiaLatencyRow[] }) {
	const total = rows.reduce((s, r) => s + r.count, 0)
	const pieData = rows.map((d, i) => ({
		name: d.name,
		value: d.count,
		fill: DONUT_COLORS[i % DONUT_COLORS.length],
	}))
	const config: ChartConfig = Object.fromEntries(
		pieData.map((d) => [d.name, { label: d.name, color: d.fill }]),
	)
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Turns by Domia</CardTitle>
			</CardHeader>
			<CardContent>
				{pieData.length ? (
					<div className="flex items-center gap-4">
						<ChartContainer config={config} className="aspect-square h-40">
							<PieChart>
								<ChartTooltip
									content={<ChartTooltipContent nameKey="name" hideLabel />}
								/>
								<Pie
									data={pieData}
									dataKey="value"
									nameKey="name"
									innerRadius={40}
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
								<div key={d.name} className="flex items-center gap-2 text-sm">
									<span
										className="size-2.5 rounded-sm"
										style={{ background: d.fill }}
									/>
									<span className="flex-1 truncate">{d.name}</span>
									<span className="text-muted-foreground tabular-nums">
										{total ? `${Math.round((d.value / total) * 100)}%` : ""}
									</span>
									<span className="tabular-nums">{d.value}</span>
								</div>
							))}
						</div>
					</div>
				) : (
					<p className="text-muted-foreground py-10 text-center text-sm">
						No data yet.
					</p>
				)}
			</CardContent>
		</Card>
	)
}

export function FlowChart({ rows }: { rows: FlowLatencyRow[] }) {
	const data = rows.map((f) => ({
		name: FLOW_LABEL[f.flow] ?? f.flow,
		p50: f.ttfa.p50 ?? 0,
		p95: f.ttfa.p95 ?? 0,
	}))
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">TTFA by flow</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length ? (
					<ChartContainer
						config={flowConfig}
						className="w-full"
						style={{ height: chartHeight(data.length * 2) }}
					>
						<BarChart
							data={data}
							layout="vertical"
							accessibilityLayer
							margin={{ left: 8, right: 12 }}
						>
							<CartesianGrid horizontal={false} />
							<XAxis type="number" tickLine={false} axisLine={false} />
							<YAxis
								type="category"
								dataKey="name"
								tickLine={false}
								axisLine={false}
								width={110}
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
							<ChartLegend content={<ChartLegendContent />} />
							<Bar dataKey="p50" fill="var(--color-p50)" radius={4} />
							<Bar dataKey="p95" fill="var(--color-p95)" radius={4} />
						</BarChart>
					</ChartContainer>
				) : (
					<p className="text-muted-foreground py-10 text-center text-sm">
						No data yet.
					</p>
				)}
			</CardContent>
		</Card>
	)
}

export function ModelChart({ rows }: { rows: StagePerfRow[] }) {
	const data = rows.map((m) => ({
		name: `${STAGE_LABEL[m.stage]} · ${m.model}`,
		avgMs: m.avgMs ?? 0,
		count: m.count,
	}))
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Model performance</CardTitle>
			</CardHeader>
			<CardContent>
				{data.length ? (
					<ChartContainer
						config={modelConfig}
						className="w-full"
						style={{ height: chartHeight(data.length) }}
					>
						<BarChart
							data={data}
							layout="vertical"
							accessibilityLayer
							margin={{ left: 8, right: 12 }}
						>
							<CartesianGrid horizontal={false} />
							<XAxis type="number" tickLine={false} axisLine={false} />
							<YAxis
								type="category"
								dataKey="name"
								tickLine={false}
								axisLine={false}
								width={140}
							/>
							<ChartTooltip content={<ChartTooltipContent />} />
							<Bar dataKey="avgMs" fill="var(--color-avgMs)" radius={4} />
						</BarChart>
					</ChartContainer>
				) : (
					<p className="text-muted-foreground py-10 text-center text-sm">
						No model data yet.
					</p>
				)}
			</CardContent>
		</Card>
	)
}
