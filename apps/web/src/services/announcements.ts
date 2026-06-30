import { and, desc, eq } from "drizzle-orm"
import { announcement, audioAsset, domiaRegistry } from "@domia-app/db"
import { db } from "@/db"
import type { RecentBroadcast } from "@/types/broadcast"

const SCAN_LIMIT = 160
const MAX_GROUPS = 12

export const recentAnnouncements = async (): Promise<RecentBroadcast[]> => {
	const rows = await db
		.select({
			id: announcement.id,
			broadcastId: announcement.broadcastId,
			text: announcement.text,
			kind: announcement.kind,
			delivery: announcement.delivery,
			delivered: announcement.delivered,
			sourceDomiaKey: announcement.sourceDomiaKey,
			createdAt: announcement.createdAt,
			domiaName: domiaRegistry.name,
			audioAssetId: audioAsset.id,
		})
		.from(announcement)
		.leftJoin(
			domiaRegistry,
			eq(announcement.sourceDomiaKey, domiaRegistry.domiaKey),
		)
		.leftJoin(
			audioAsset,
			and(
				eq(audioAsset.interactionId, announcement.id),
				eq(audioAsset.kind, "announce"),
			),
		)
		.orderBy(desc(announcement.createdAt))
		.limit(SCAN_LIMIT)

	const groups = new Map<string, RecentBroadcast>()
	for (const r of rows) {
		let group = groups.get(r.broadcastId)
		if (!group) {
			if (groups.size >= MAX_GROUPS) continue
			group = {
				broadcastId: r.broadcastId,
				text: r.text,
				kind: r.kind,
				delivery: r.delivery,
				createdAt: r.createdAt,
				audioId: null,
				delivered: 0,
				total: 0,
				targets: [],
			}
			groups.set(r.broadcastId, group)
		}
		group.total += 1
		if (r.delivered) group.delivered += 1
		if (!group.text && r.text) group.text = r.text
		if (!group.audioId && r.audioAssetId) group.audioId = r.id
		group.targets.push({
			domiaKey: r.sourceDomiaKey,
			name: r.domiaName ?? r.sourceDomiaKey,
			delivered: Boolean(r.delivered),
		})
	}
	return [...groups.values()]
}
