import type { EmotionEventRow as DbEmotionEventRow } from "@domia-app/db"
import type { EmotionState } from "@/types"

export type EmotionKey = keyof EmotionState

export type EmotionSeriesPoint = { ts: string; time: string } & Record<
	EmotionKey,
	number
> & { dominantBand: number }

export type EmotionEventRow = DbEmotionEventRow & { domiaName: string | null }

export type EmotionDomiaOverview = {
	domiaKey: string
	name: string
	avatarId: string | null
	emotion: EmotionState | null
	dominant: EmotionKey | null
	events: EmotionEventRow[]
	series: EmotionSeriesPoint[]
}

export type EmotionsOverview = {
	domias: EmotionDomiaOverview[]
}
