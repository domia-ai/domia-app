import { m } from "@/paraglide/messages"
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

const AXES: { key: keyof EmotionState; label: () => string }[] = [
	{ key: "joy", label: m.enum_emotion_joy },
	{ key: "trust", label: m.enum_emotion_trust },
	{ key: "fear", label: m.enum_emotion_fear },
	{ key: "surprise", label: m.enum_emotion_surprise },
	{ key: "sadness", label: m.enum_emotion_sadness },
	{ key: "disgust", label: m.enum_emotion_disgust },
	{ key: "anger", label: m.enum_emotion_anger },
	{ key: "anticipation", label: m.enum_emotion_anticipation },
]

const config = () =>
	({ value: { label: m.domia_mood_title() } }) satisfies ChartConfig

export function MoodRadar({ emotion, accent }: MoodRadarProps) {
	const data = AXES.map((a) => ({
		axis: a.label(),
		value: Math.max(0, Math.min(1, emotion[a.key] ?? 0)),
	}))

	return (
		<ChartContainer
			config={config()}
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
