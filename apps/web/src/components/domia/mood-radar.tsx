import {
	PolarAngleAxis,
	PolarGrid,
	PolarRadiusAxis,
	Radar,
	RadarChart,
} from "recharts"
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart"
import type { EmotionState, MoodRadarProps } from "@/types"

const AXES: { key: keyof EmotionState; label: string }[] = [
	{ key: "joy", label: "Joy" },
	{ key: "trust", label: "Trust" },
	{ key: "fear", label: "Fear" },
	{ key: "surprise", label: "Surprise" },
	{ key: "sadness", label: "Sadness" },
	{ key: "disgust", label: "Disgust" },
	{ key: "anger", label: "Anger" },
	{ key: "anticipation", label: "Anticip." },
]

const config = { value: { label: "Mood" } } satisfies ChartConfig

export function MoodRadar({ emotion, accent }: MoodRadarProps) {
	const data = AXES.map((a) => ({
		axis: a.label,
		value: Math.max(0, Math.min(1, emotion[a.key] ?? 0)),
	}))

	return (
		<ChartContainer
			config={config}
			className="mx-auto aspect-square h-56 w-full max-w-[260px]"
		>
			<RadarChart data={data} outerRadius="72%">
				<ChartTooltip
					cursor={false}
					content={
						<ChartTooltipContent
							labelKey="axis"
							formatter={(value) => (
								<span className="tabular-nums">{Number(value).toFixed(2)}</span>
							)}
						/>
					}
				/>
				<PolarGrid />
				<PolarAngleAxis dataKey="axis" tick={{ fontSize: 9 }} />
				<PolarRadiusAxis domain={[0, 1]} tick={false} axisLine={false} />
				<Radar
					dataKey="value"
					fill={accent}
					fillOpacity={0.2}
					stroke={accent}
					strokeWidth={1.5}
					dot={{ r: 2.5, fillOpacity: 1 }}
				/>
			</RadarChart>
		</ChartContainer>
	)
}
