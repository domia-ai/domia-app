import type { EmotionState } from "@/types"

export type EmotionKey = keyof EmotionState

export const EMOTION_KEYS: EmotionKey[] = [
	"joy",
	"trust",
	"anticipation",
	"surprise",
	"fear",
	"sadness",
	"anger",
	"disgust",
]

export const EMOTION_META: Record<
	EmotionKey,
	{ label: string; color: string }
> = {
	joy: { label: "Joy", color: "var(--chart-1)" },
	trust: { label: "Trust", color: "var(--chart-2)" },
	anticipation: { label: "Anticipation", color: "var(--chart-3)" },
	surprise: { label: "Surprise", color: "var(--chart-4)" },
	fear: { label: "Fear", color: "var(--chart-5)" },
	sadness: { label: "Sadness", color: "var(--primary)" },
	anger: { label: "Anger", color: "var(--destructive)" },
	disgust: { label: "Disgust", color: "var(--muted-foreground)" },
}

export const dominantEmotion = (
	emotion: EmotionState | null,
): EmotionKey | null => {
	if (!emotion) return null
	let best: EmotionKey | null = null
	let bestVal = -Infinity
	for (const k of EMOTION_KEYS) {
		const v = emotion[k] ?? 0
		if (v > bestVal) {
			bestVal = v
			best = k
		}
	}
	return bestVal > 0 ? best : null
}
