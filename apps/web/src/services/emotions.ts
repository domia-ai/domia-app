import { asc, eq, getTableColumns } from "drizzle-orm"
import { domiaRegistry, emotionEvent } from "@domia-app/db"
import { db } from "@/db"
import { parseConfigSnapshot } from "@/utils/config"
import { buildEmotionSeries } from "@/utils/emotion-series"
import { dominantEmotion } from "@/constants/emotions"
import type { EmotionEventRow, EmotionsOverview } from "@/types/emotions"

const MAX_EVENTS = 500

export const getEmotionsOverview = async (): Promise<EmotionsOverview> => {
	const moods = await db
		.select({
			domiaKey: domiaRegistry.domiaKey,
			name: domiaRegistry.name,
			avatarId: domiaRegistry.avatarId,
			configSnapshotJson: domiaRegistry.configSnapshotJson,
		})
		.from(domiaRegistry)
		.orderBy(domiaRegistry.name)

	const events = (await db
		.select({
			...getTableColumns(emotionEvent),
			domiaName: domiaRegistry.name,
		})
		.from(emotionEvent)
		.leftJoin(
			domiaRegistry,
			eq(emotionEvent.sourceDomiaKey, domiaRegistry.domiaKey),
		)
		.orderBy(asc(emotionEvent.createdAt))
		.limit(MAX_EVENTS)) as EmotionEventRow[]

	const byKey = new Map<string, EmotionEventRow[]>()
	for (const e of events) {
		const list = byKey.get(e.sourceDomiaKey) ?? []
		list.push(e)
		byKey.set(e.sourceDomiaKey, list)
	}

	const domias = moods.map((m) => {
		const emotion =
			parseConfigSnapshot(m.configSnapshotJson).emotionState ?? null
		const evs = byKey.get(m.domiaKey) ?? []
		return {
			domiaKey: m.domiaKey,
			name: m.name,
			avatarId: m.avatarId,
			emotion,
			dominant: dominantEmotion(emotion),
			events: evs,
			series: buildEmotionSeries(emotion, evs),
		}
	})

	return { domias }
}
