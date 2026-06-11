import type { EmotionEventRow as DbEmotionEventRow } from "@domia-app/db"
import type { EmotionState } from "@/types"
import type { EmotionKey } from "@/constants/emotions"
import type { EmotionSeriesPoint } from "@/utils/emotion-series"

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
