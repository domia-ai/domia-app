import { EMOTION_KEYS, type EmotionKey } from "@/constants/emotions"
import type { EmotionState } from "@/types"
import type { EmotionEventRow } from "@/types/emotions"

export type EmotionSeriesPoint = { ts: string; time: string } & Record<
	EmotionKey,
	number
> & { dominantBand: number }

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

const parseDelta = (delta: unknown): Partial<Record<EmotionKey, number>> => {
	if (!delta || typeof delta !== "object") return {}
	const out: Partial<Record<EmotionKey, number>> = {}
	for (const [k, v] of Object.entries(delta as Record<string, unknown>))
		if (typeof v === "number" && (EMOTION_KEYS as string[]).includes(k))
			out[k as EmotionKey] = v
	return out
}

const fmtTime = (ts: string): string => {
	const d = new Date(ts)
	if (Number.isNaN(d.getTime())) return ts
	return d.toLocaleTimeString("en-US", {
		hour: "2-digit",
		minute: "2-digit",
	})
}

export const buildEmotionSeries = (
	currentEmotion: EmotionState | null,
	events: EmotionEventRow[],
): EmotionSeriesPoint[] => {
	if (events.length === 0) return []

	const current: Record<EmotionKey, number> = {} as Record<EmotionKey, number>
	for (const k of EMOTION_KEYS) current[k] = currentEmotion?.[k] ?? 0.5

	const total: Record<EmotionKey, number> = {} as Record<EmotionKey, number>
	for (const k of EMOTION_KEYS) total[k] = 0
	for (const e of events) {
		const d = parseDelta(e.delta)
		for (const k of EMOTION_KEYS) total[k] += d[k] ?? 0
	}

	const state: Record<EmotionKey, number> = {} as Record<EmotionKey, number>
	for (const k of EMOTION_KEYS) state[k] = current[k] - total[k]

	const points: EmotionSeriesPoint[] = []
	for (const e of events) {
		const d = parseDelta(e.delta)
		for (const k of EMOTION_KEYS) state[k] += d[k] ?? 0
		const point = {
			ts: e.createdAt,
			time: fmtTime(e.createdAt),
		} as EmotionSeriesPoint
		let dom = 0
		for (const k of EMOTION_KEYS) {
			const v = Math.round(clamp01(state[k]) * 100)
			point[k] = v
			if (v > dom) dom = v
		}
		point.dominantBand = dom
		points.push(point)
	}
	return points
}
