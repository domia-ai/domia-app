import { desc, eq, getTableColumns } from "drizzle-orm"
import { domiaRegistry, emotionEvent } from "@domia-app/db"
import { db } from "@/db"
import { parseConfigSnapshot } from "@/utils/config"
import { buildEmotionSeries } from "@/utils/emotion-series"
import { dominantEmotion } from "@/constants/emotions"
import type { EmotionEventRow, EmotionsOverview } from "@/types/emotions"

const MAX_EVENTS_PER_DOMIA = 500

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

	const domias = await Promise.all(
		moods.map(async (m) => {
			const recentFirst = (await db
				.select({
					...getTableColumns(emotionEvent),
					domiaName: domiaRegistry.name,
				})
				.from(emotionEvent)
				.leftJoin(
					domiaRegistry,
					eq(emotionEvent.sourceDomiaKey, domiaRegistry.domiaKey),
				)
				.where(eq(emotionEvent.sourceDomiaKey, m.domiaKey))
				.orderBy(desc(emotionEvent.createdAt))
				.limit(MAX_EVENTS_PER_DOMIA)) as EmotionEventRow[]

			const evs = recentFirst.slice().reverse()
			const emotion =
				parseConfigSnapshot(m.configSnapshotJson).emotionState ?? null
			return {
				domiaKey: m.domiaKey,
				name: m.name,
				avatarId: m.avatarId,
				emotion,
				dominant: dominantEmotion(emotion),
				events: recentFirst,
				series: buildEmotionSeries(emotion, evs),
			}
		}),
	)

	return { domias }
}
