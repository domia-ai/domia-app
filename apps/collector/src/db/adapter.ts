import {
	and,
	desc,
	eq,
	getTableColumns,
	inArray,
	isNotNull,
	notInArray,
} from "drizzle-orm"
import {
	domiaRegistry,
	interactionTrace,
	interactionSessionTrace,
	emotionEvent,
	memoryFact,
	syncCursor,
	audioAsset,
	announcement,
	turnEvent,
	toolRun,
	memoryEpisode,
	userModel,
	knowledgeEntry,
	voiceFeelAdjustment,
	factEvidence,
	type DomiaRegistryInsert,
	type AudioAssetInsert,
	type SyncCursorInsert,
} from "@domia-app/db"
import { db } from "@/db"
import { ingestionLogger } from "@/utils"
import type { MirrorColumn, SyncCursors, SyncResponse } from "@/types"

const mirrorColumns = (columns: Record<string, unknown>): MirrorColumn[] =>
	Object.entries(columns).filter(
		([name]) => name !== "sourceDomiaKey",
	) as MirrorColumn[]

const TRACE_COLUMNS = mirrorColumns(getTableColumns(interactionTrace))
const SESSION_COLUMNS = mirrorColumns(getTableColumns(interactionSessionTrace))
const EMOTION_EVENT_COLUMNS = mirrorColumns(getTableColumns(emotionEvent))
const FACT_COLUMNS = mirrorColumns(getTableColumns(memoryFact))
const ANNOUNCEMENT_COLUMNS = mirrorColumns(getTableColumns(announcement))
const TOOL_RUN_COLUMNS = mirrorColumns(getTableColumns(toolRun))
const EPISODE_COLUMNS = mirrorColumns(getTableColumns(memoryEpisode))
const USER_MODEL_COLUMNS = mirrorColumns(getTableColumns(userModel))
const KNOWLEDGE_COLUMNS = mirrorColumns(getTableColumns(knowledgeEntry))
const VOICE_FEEL_COLUMNS = mirrorColumns(getTableColumns(voiceFeelAdjustment))
const EVIDENCE_COLUMNS = mirrorColumns(getTableColumns(factEvidence))

const MIRROR_NAMES = new Map<MirrorColumn[], string>([
	[TRACE_COLUMNS, "interaction_trace"],
	[SESSION_COLUMNS, "interaction_session_trace"],
	[EMOTION_EVENT_COLUMNS, "emotion_event"],
	[FACT_COLUMNS, "memory_fact"],
	[ANNOUNCEMENT_COLUMNS, "announcement"],
	[TOOL_RUN_COLUMNS, "tool_run"],
	[EPISODE_COLUMNS, "memory_episode"],
	[USER_MODEL_COLUMNS, "user_model"],
	[KNOWLEDGE_COLUMNS, "knowledge_entry"],
	[VOICE_FEEL_COLUMNS, "voice_feel_adjustment"],
	[EVIDENCE_COLUMNS, "fact_evidence"],
])
const MIRROR_SKIPPED_KEYS = new Set(["domiaId"])
const reportedUnmirrored = new WeakMap<MirrorColumn[], Set<string>>()

const warnUnmirrored = (
	columns: MirrorColumn[],
	source: Record<string, unknown>,
): void => {
	const known = new Set(columns.map(([name]) => name))
	const reported = reportedUnmirrored.get(columns) ?? new Set<string>()
	const fresh = Object.keys(source).filter(
		(key) =>
			!known.has(key) && !MIRROR_SKIPPED_KEYS.has(key) && !reported.has(key),
	)
	if (fresh.length === 0) return
	for (const key of fresh) reported.add(key)
	reportedUnmirrored.set(columns, reported)
	ingestionLogger.warn(
		"⚠️ /sync row carries columns the mirror does not store",
		{
			table: MIRROR_NAMES.get(columns) ?? "unknown",
			columns: fresh,
		},
	)
}

const mirrorValues = <T>(
	columns: MirrorColumn[],
	domiaKey: string,
	row: object,
): T => {
	const source = row as Record<string, unknown>
	warnUnmirrored(columns, source)
	const values: Record<string, unknown> = { sourceDomiaKey: domiaKey }
	for (const [name, column] of columns) {
		const incoming = source[name]
		if (incoming === undefined && column.hasDefault) continue
		values[name] = incoming ?? null
	}
	return values as T
}

const emptyCursor = (at: string | null, id: string | null) => ({
	since: at ?? "",
	id: id ?? "",
})

const dbAdapter = {
	upsertRegistry: (
		insertValues: DomiaRegistryInsert,
		updateSet: Partial<DomiaRegistryInsert>,
	) => {
		db.insert(domiaRegistry)
			.values(insertValues)
			.onConflictDoUpdate({ target: domiaRegistry.domiaKey, set: updateSet })
			.run()
	},
	markNodeOffline: (nodeId: string, staleAt: number) => {
		db.update(domiaRegistry)
			.set({ lastSeenAt: staleAt })
			.where(eq(domiaRegistry.nodeId, nodeId))
			.run()
	},
	getActiveMirrorIdentities: () =>
		db
			.select({
				domiaKey: domiaRegistry.domiaKey,
				nodeId: domiaRegistry.nodeId,
				localIp: domiaRegistry.localIp,
				httpPort: domiaRegistry.httpPort,
				httpScheme: domiaRegistry.httpScheme,
			})
			.from(domiaRegistry)
			.where(
				and(
					eq(domiaRegistry.isActive, true),
					isNotNull(domiaRegistry.nodeId),
					isNotNull(domiaRegistry.localIp),
					isNotNull(domiaRegistry.httpPort),
				),
			)
			.all(),
	bumpMirrorLastSeen: (keys: string[], at: number) => {
		if (keys.length === 0) return
		db.update(domiaRegistry)
			.set({ lastSeenAt: at })
			.where(
				and(
					eq(domiaRegistry.isActive, true),
					inArray(domiaRegistry.domiaKey, keys),
				),
			)
			.run()
	},
	retireMirrorIdentitiesByNode: (nodeId: string, keepKeys: string[]) => {
		if (keepKeys.length === 0) return
		db.update(domiaRegistry)
			.set({ isActive: false, updatedAt: Date.now() })
			.where(
				and(
					eq(domiaRegistry.nodeId, nodeId),
					eq(domiaRegistry.isActive, true),
					notInArray(domiaRegistry.domiaKey, keepKeys),
				),
			)
			.run()
	},
	readRegistryConfig: (domiaKey: string): string | null => {
		const row = db
			.select({ json: domiaRegistry.configSnapshotJson })
			.from(domiaRegistry)
			.where(eq(domiaRegistry.domiaKey, domiaKey))
			.get()
		return row?.json ?? null
	},
	readCursors: (domiaKey: string): SyncCursors => {
		const row = db
			.select()
			.from(syncCursor)
			.where(eq(syncCursor.domiaKey, domiaKey))
			.get()
		return {
			interaction: row?.lastInteractionAt ?? "",
			turn: emptyCursor(row?.lastTurnAt ?? null, row?.lastTurnId ?? null),
			facts: emptyCursor(row?.lastFactsAt ?? null, row?.lastFactsId ?? null),
			tool: emptyCursor(row?.lastToolAt ?? null, row?.lastToolId ?? null),
			episode: emptyCursor(
				row?.lastEpisodeAt ?? null,
				row?.lastEpisodeId ?? null,
			),
			knowledge: emptyCursor(
				row?.lastKnowledgeAt ?? null,
				row?.lastKnowledgeId ?? null,
			),
			voiceFeel: emptyCursor(
				row?.lastVoiceFeelAt ?? null,
				row?.lastVoiceFeelId ?? null,
			),
			evidence: emptyCursor(
				row?.lastEvidenceAt ?? null,
				row?.lastEvidenceId ?? null,
			),
		}
	},
	readLastSyncedAt: (domiaKey: string): number | null => {
		const row = db
			.select({ at: syncCursor.lastSyncedAt })
			.from(syncCursor)
			.where(eq(syncCursor.domiaKey, domiaKey))
			.get()
		return row?.at ?? null
	},
	writeCursors: (domiaKey: string, cursors: Partial<SyncCursors>) => {
		const set: Partial<SyncCursorInsert> = { lastSyncedAt: Date.now() }
		if (cursors.interaction !== undefined) {
			set.lastInteractionAt = cursors.interaction
		}
		if (cursors.turn) {
			set.lastTurnAt = cursors.turn.since
			set.lastTurnId = cursors.turn.id
		}
		if (cursors.facts) {
			set.lastFactsAt = cursors.facts.since
			set.lastFactsId = cursors.facts.id
		}
		if (cursors.tool) {
			set.lastToolAt = cursors.tool.since
			set.lastToolId = cursors.tool.id
		}
		if (cursors.episode) {
			set.lastEpisodeAt = cursors.episode.since
			set.lastEpisodeId = cursors.episode.id
		}
		if (cursors.knowledge) {
			set.lastKnowledgeAt = cursors.knowledge.since
			set.lastKnowledgeId = cursors.knowledge.id
		}
		if (cursors.voiceFeel) {
			set.lastVoiceFeelAt = cursors.voiceFeel.since
			set.lastVoiceFeelId = cursors.voiceFeel.id
		}
		if (cursors.evidence) {
			set.lastEvidenceAt = cursors.evidence.since
			set.lastEvidenceId = cursors.evidence.id
		}
		db.insert(syncCursor)
			.values({ domiaKey, ...set })
			.onConflictDoUpdate({ target: syncCursor.domiaKey, set })
			.run()
		if (cursors.interaction !== undefined) {
			db.update(domiaRegistry)
				.set({ lastInteractionAt: cursors.interaction })
				.where(eq(domiaRegistry.domiaKey, domiaKey))
				.run()
		}
	},
	listMissingAudio: (
		domiaKey: string,
		kind: "tts" | "input" | "announce",
		limit: number,
	): string[] => {
		const archived = db
			.select({ id: audioAsset.interactionId })
			.from(audioAsset)
			.where(
				and(eq(audioAsset.sourceDomiaKey, domiaKey), eq(audioAsset.kind, kind)),
			)
		if (kind === "announce") {
			return db
				.select({ id: announcement.id })
				.from(announcement)
				.where(
					and(
						eq(announcement.sourceDomiaKey, domiaKey),
						isNotNull(announcement.audioPath),
						notInArray(announcement.id, archived),
					),
				)
				.orderBy(desc(announcement.createdAt))
				.limit(limit)
				.all()
				.map((r) => r.id)
		}
		const pathCol =
			kind === "tts"
				? interactionTrace.ttsAudioPath
				: interactionTrace.inputAudioPath
		return db
			.select({ id: interactionTrace.id })
			.from(interactionTrace)
			.where(
				and(
					eq(interactionTrace.sourceDomiaKey, domiaKey),
					isNotNull(pathCol),
					notInArray(interactionTrace.id, archived),
				),
			)
			.orderBy(desc(interactionTrace.createdAt))
			.limit(limit)
			.all()
			.map((r) => r.id)
	},

	hasAudio: (id: string): boolean =>
		Boolean(
			db
				.select({ id: audioAsset.id })
				.from(audioAsset)
				.where(eq(audioAsset.id, id))
				.get(),
		),
	insertAudio: (values: AudioAssetInsert) => {
		db.insert(audioAsset).values(values).onConflictDoNothing().run()
	},
	mirrorSync: (domiaKey: string, data: SyncResponse) => {
		db.transaction((tx) => {
			for (const r of data.sessions) {
				const values = mirrorValues<
					typeof interactionSessionTrace.$inferInsert
				>(SESSION_COLUMNS, domiaKey, r)
				tx.insert(interactionSessionTrace)
					.values(values)
					.onConflictDoUpdate({
						target: interactionSessionTrace.id,
						set: values,
					})
					.run()
			}
			for (const r of data.interactions) {
				const values = mirrorValues<typeof interactionTrace.$inferInsert>(
					TRACE_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(interactionTrace)
					.values(values)
					.onConflictDoUpdate({ target: interactionTrace.id, set: values })
					.run()
			}
			for (const r of data.emotionEvents) {
				const values = mirrorValues<typeof emotionEvent.$inferInsert>(
					EMOTION_EVENT_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(emotionEvent)
					.values(values)
					.onConflictDoUpdate({ target: emotionEvent.id, set: values })
					.run()
			}
			for (const r of data.facts) {
				const values = mirrorValues<typeof memoryFact.$inferInsert>(
					FACT_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(memoryFact)
					.values(values)
					.onConflictDoUpdate({ target: memoryFact.id, set: values })
					.run()
			}
			for (const r of data.announcements) {
				const values = mirrorValues<typeof announcement.$inferInsert>(
					ANNOUNCEMENT_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(announcement)
					.values(values)
					.onConflictDoUpdate({ target: announcement.id, set: values })
					.run()
			}
			for (const r of data.turnEvents) {
				const values = {
					id: r.id,
					sourceDomiaKey: domiaKey,
					interactionId: r.interactionId,
					type: r.type,
					seq: r.seq,
					ts: r.ts,
					originDomiaKey: r.originDomiaKey ?? null,
					executorDomiaKey: r.executorDomiaKey ?? null,
					satelliteId: r.satelliteId ?? null,
					traceId: r.traceId ?? null,
					payload: r.payload ?? null,
					createdAt: r.createdAt,
				}
				tx.insert(turnEvent)
					.values(values)
					.onConflictDoUpdate({
						target: [turnEvent.interactionId, turnEvent.seq],
						set: values,
					})
					.run()
			}
			for (const r of data.toolRuns) {
				const values = mirrorValues<typeof toolRun.$inferInsert>(
					TOOL_RUN_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(toolRun)
					.values(values)
					.onConflictDoUpdate({ target: toolRun.id, set: values })
					.run()
			}
			for (const r of data.memoryEpisodes) {
				const values = mirrorValues<typeof memoryEpisode.$inferInsert>(
					EPISODE_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(memoryEpisode)
					.values(values)
					.onConflictDoUpdate({ target: memoryEpisode.id, set: values })
					.run()
			}
			for (const r of data.knowledgeEntries) {
				const values = mirrorValues<typeof knowledgeEntry.$inferInsert>(
					KNOWLEDGE_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(knowledgeEntry)
					.values(values)
					.onConflictDoUpdate({ target: knowledgeEntry.id, set: values })
					.run()
			}
			for (const r of data.voiceFeelAdjustments) {
				const values = mirrorValues<typeof voiceFeelAdjustment.$inferInsert>(
					VOICE_FEEL_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(voiceFeelAdjustment)
					.values(values)
					.onConflictDoUpdate({ target: voiceFeelAdjustment.id, set: values })
					.run()
			}
			for (const r of data.factEvidence) {
				const values = mirrorValues<typeof factEvidence.$inferInsert>(
					EVIDENCE_COLUMNS,
					domiaKey,
					r,
				)
				tx.insert(factEvidence)
					.values(values)
					.onConflictDoUpdate({ target: factEvidence.id, set: values })
					.run()
			}
			if (data.userModel) {
				const values = mirrorValues<typeof userModel.$inferInsert>(
					USER_MODEL_COLUMNS,
					domiaKey,
					data.userModel,
				)
				tx.insert(userModel)
					.values(values)
					.onConflictDoUpdate({ target: userModel.sourceDomiaKey, set: values })
					.run()
			}
		})
	},
}

export default dbAdapter
