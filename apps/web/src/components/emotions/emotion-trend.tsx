import {
	Area,
	CartesianGrid,
	ComposedChart,
	Line,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts"
import {
	EMOTION_KEYS,
	EMOTION_META,
	type EmotionKey,
} from "@/constants/emotions"
import type { EmotionSeriesPoint } from "@/utils/emotion-series"

export function EmotionTrend({
	series,
	visible,
	accent,
}: {
	series: EmotionSeriesPoint[]
	visible: Set<EmotionKey>
	accent: string
}) {
	if (series.length === 0)
		return (
			<div className="text-muted-foreground flex h-[300px] items-center justify-center text-sm">
				No emotion shifts recorded for this Domia yet.
			</div>
		)

	return (
		<ResponsiveContainer width="100%" height={300}>
			<ComposedChart data={series} margin={{ left: -16, right: 8, top: 8 }}>
				<defs>
					<linearGradient id="domBand" x1="0" y1="0" x2="0" y2="1">
						<stop offset="0%" stopColor={accent} stopOpacity={0.18} />
						<stop offset="100%" stopColor={accent} stopOpacity={0.01} />
					</linearGradient>
				</defs>
				<CartesianGrid
					strokeDasharray="3 3"
					stroke="var(--border)"
					vertical={false}
				/>
				<XAxis
					dataKey="time"
					tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
					tickLine={false}
					axisLine={false}
					interval="preserveStartEnd"
					minTickGap={32}
				/>
				<YAxis
					domain={[0, 100]}
					tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
					tickLine={false}
					axisLine={false}
				/>
				<Tooltip
					contentStyle={{
						background: "var(--popover)",
						border: "1px solid var(--border)",
						borderRadius: 8,
						fontSize: 12,
						color: "var(--popover-foreground)",
					}}
				/>
				<Area
					type="monotone"
					dataKey="dominantBand"
					stroke="none"
					fill="url(#domBand)"
					isAnimationActive={false}
					name="Peak"
				/>
				{EMOTION_KEYS.filter((k) => visible.has(k)).map((k) => (
					<Line
						key={k}
						type="monotone"
						dataKey={k}
						name={EMOTION_META[k].label()}
						stroke={EMOTION_META[k].color}
						strokeWidth={2}
						dot={false}
						isAnimationActive={false}
					/>
				))}
			</ComposedChart>
		</ResponsiveContainer>
	)
}
