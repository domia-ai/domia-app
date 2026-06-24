import {
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
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
import type { AnalyticsChartsProps } from "@/types/analytics"

const volumeConfig = {
	count: { label: "Interactions", color: "var(--chart-1)" },
	errors: { label: "Errors", color: "var(--chart-4)" },
} satisfies ChartConfig

const latencyConfig = {
	avgMs: { label: "Avg latency (ms)", color: "var(--chart-2)" },
} satisfies ChartConfig

const histConfig = {
	count: { label: "Interactions", color: "var(--chart-3)" },
} satisfies ChartConfig

const shortDate = (b: string) => b.slice(5)

export function AnalyticsCharts({
	timeSeries,
	histogram,
}: AnalyticsChartsProps) {
	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<Card>
				<CardHeader>
					<CardTitle className="text-base">TTFA distribution</CardTitle>
				</CardHeader>
				<CardContent>
					<ChartContainer config={histConfig} className="h-52 w-full">
						<BarChart data={histogram} accessibilityLayer>
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

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Volume over time</CardTitle>
				</CardHeader>
				<CardContent>
					<ChartContainer config={volumeConfig} className="h-52 w-full">
						<BarChart data={timeSeries} accessibilityLayer>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="bucket"
								tickFormatter={shortDate}
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
							<ChartLegend content={<ChartLegendContent />} />
							<Bar dataKey="count" fill="var(--color-count)" radius={4} />
							<Bar dataKey="errors" fill="var(--color-errors)" radius={4} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-base">Latency trend</CardTitle>
				</CardHeader>
				<CardContent>
					<ChartContainer config={latencyConfig} className="h-52 w-full">
						<LineChart data={timeSeries} accessibilityLayer>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="bucket"
								tickFormatter={shortDate}
								tickLine={false}
								axisLine={false}
								tickMargin={8}
							/>
							<YAxis tickLine={false} axisLine={false} width={40} />
							<ChartTooltip content={<ChartTooltipContent />} />
							<Line
								dataKey="avgMs"
								type="monotone"
								stroke="var(--color-avgMs)"
								strokeWidth={2}
								dot={false}
							/>
						</LineChart>
					</ChartContainer>
				</CardContent>
			</Card>
		</div>
	)
}
