import { m } from "@/paraglide/messages"
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
	{ label: () => string; color: string }
> = {
	joy: { label: m.enum_emotion_joy, color: "var(--chart-1)" },
	trust: { label: m.enum_emotion_trust, color: "var(--chart-2)" },
	anticipation: { label: m.enum_emotion_anticipation, color: "var(--chart-3)" },
	surprise: { label: m.enum_emotion_surprise, color: "var(--chart-4)" },
	fear: { label: m.enum_emotion_fear, color: "var(--chart-5)" },
	sadness: { label: m.enum_emotion_sadness, color: "var(--primary)" },
	anger: { label: m.enum_emotion_anger, color: "var(--destructive)" },
	disgust: { label: m.enum_emotion_disgust, color: "var(--muted-foreground)" },
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
