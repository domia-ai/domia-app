import { statSync } from "node:fs"
import { resolve } from "node:path"
import { count, desc, eq } from "drizzle-orm"
import type { SQLiteTable } from "drizzle-orm/sqlite-core"
import {
	audioAsset,
	domiaRegistry,
	emotionEvent,
	interactionSessionTrace,
	interactionTrace,
	memoryFact,
	mindTemplate,
	syncCursor,
} from "@domia-app/db"
import { db } from "@/db"
import { env } from "@/config"
import { isOnline } from "@/utils/presence"
import pkg from "../../package.json"
import type {
	DataCounts,
	SettingsOverview,
	SyncStatusRow,
} from "@/types/settings"

const countOf = async (table: SQLiteTable) => {
	const [row] = await db.select({ value: count() }).from(table)
	return row?.value ?? 0
}

const getSyncStatus = async (): Promise<SyncStatusRow[]> => {
	const rows = await db
		.select({
			domiaKey: domiaRegistry.domiaKey,
			name: domiaRegistry.name,
			avatarId: domiaRegistry.avatarId,
			lastSeenAt: domiaRegistry.lastSeenAt,
			lastSyncedAt: syncCursor.lastSyncedAt,
			cursorAt: syncCursor.lastInteractionAt,
		})
		.from(domiaRegistry)
		.leftJoin(syncCursor, eq(domiaRegistry.domiaKey, syncCursor.domiaKey))
		.orderBy(desc(domiaRegistry.lastSeenAt))

	return rows.map((r) => ({
		domiaKey: r.domiaKey,
		name: r.name,
		avatarId: r.avatarId,
		online: isOnline(r.lastSeenAt),
		lastSyncedAt: r.lastSyncedAt,
		cursorAt: r.cursorAt || null,
	}))
}

const getDataCounts = async (): Promise<DataCounts> => {
	const [
		domias,
		interactions,
		sessions,
		memoryFacts,
		emotionEvents,
		audioAssets,
		templates,
	] = await Promise.all([
		countOf(domiaRegistry),
		countOf(interactionTrace),
		countOf(interactionSessionTrace),
		countOf(memoryFact),
		countOf(emotionEvent),
		countOf(audioAsset),
		countOf(mindTemplate),
	])
	return {
		domias,
		interactions,
		sessions,
		memoryFacts,
		emotionEvents,
		audioAssets,
		templates,
	}
}

const getDbBytes = (): number | null => {
	try {
		return statSync(resolve(process.cwd(), env.DATABASE_URL)).size
	} catch {
		return null
	}
}

export const getSettingsOverview = async (): Promise<SettingsOverview> => {
	const [sync, counts] = await Promise.all([getSyncStatus(), getDataCounts()])
	return {
		sync,
		counts,
		dbBytes: getDbBytes(),
		version: pkg.version,
	}
}
