import { and, eq, isNotNull, notInArray } from "drizzle-orm"
import {
	domiaRegistry,
	interactionTrace,
	interactionSessionTrace,
	emotionEvent,
	memoryFact,
	syncCursor,
	audioAsset,
	type DomiaRegistryInsert,
	type AudioAssetInsert,
} from "@domia-app/db"
import { db } from "@/db"
import type { SyncResponse } from "@/types"

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
	readCursor: (domiaKey: string): string => {
		const row = db
			.select({ at: syncCursor.lastInteractionAt })
			.from(syncCursor)
			.where(eq(syncCursor.domiaKey, domiaKey))
			.get()
		return row?.at ?? ""
	},
	writeCursor: (domiaKey: string, lastInteractionAt: string) => {
		const lastSyncedAt = Date.now()
		db.insert(syncCursor)
			.values({ domiaKey, lastInteractionAt, lastSyncedAt })
			.onConflictDoUpdate({
				target: syncCursor.domiaKey,
				set: { lastInteractionAt, lastSyncedAt },
			})
			.run()
		db.update(domiaRegistry)
			.set({ lastInteractionAt })
			.where(eq(domiaRegistry.domiaKey, domiaKey))
			.run()
	},
	listMissingAudio: (
		domiaKey: string,
		kind: "tts" | "input",
		limit: number,
	): string[] => {
		const pathCol =
			kind === "tts"
				? interactionTrace.ttsAudioPath
				: interactionTrace.inputAudioPath
		const archived = db
			.select({ id: audioAsset.interactionId })
			.from(audioAsset)
			.where(
				and(eq(audioAsset.sourceDomiaKey, domiaKey), eq(audioAsset.kind, kind)),
			)
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
				const values = {
					id: r.id,
					sourceDomiaKey: domiaKey,
					sessionId: r.sessionId ?? null,
					startedAt: r.startedAt ?? null,
					lastUsedAt: r.lastUsedAt ?? null,
					timeoutMs: r.timeoutMs ?? null,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
				}
				tx.insert(interactionSessionTrace)
					.values(values)
					.onConflictDoUpdate({
						target: interactionSessionTrace.id,
						set: values,
					})
					.run()
			}
			for (const r of data.interactions) {
				const values = {
					id: r.id,
					sourceDomiaKey: domiaKey,
					interactionSessionTraceId: r.interactionSessionTraceId ?? null,
					sessionId: r.sessionId ?? null,
					inputType: r.inputType ?? null,
					responseType: r.responseType ?? null,
					isActive: r.isActive ?? null,
					inputRaw: r.inputRaw ?? null,
					inputAudioPath: r.inputAudioPath ?? null,
					wakewordUsed: r.wakewordUsed ?? null,
					sttResult: r.sttResult ?? null,
					intentDecision: r.intentDecision ?? null,
					intentMs: r.intentMs ?? null,
					agentDecisionMs: r.agentDecisionMs ?? null,
					agentToolMs: r.agentToolMs ?? null,
					agentFinalizeMs: r.agentFinalizeMs ?? null,
					skillProviderUsed: r.skillProviderUsed ?? null,
					skillPrompt: r.skillPrompt ?? null,
					skillResponse: r.skillResponse ?? null,
					llmPrompt: r.llmPrompt ?? null,
					llmResponse: r.llmResponse ?? null,
					ttsEngineUsed: r.ttsEngineUsed ?? null,
					ttsAudioPath: r.ttsAudioPath ?? null,
					finalOutput: r.finalOutput ?? null,
					emotionSnapshot: r.emotionSnapshot ?? null,
					characterSnapshot: r.characterSnapshot ?? null,
					userEmotionSnapshot: r.userEmotionSnapshot ?? null,
					sttMs: r.sttMs ?? null,
					sttQueueMs: r.sttQueueMs ?? null,
					llmMs: r.llmMs ?? null,
					ttsMs: r.ttsMs ?? null,
					ttsQueueMs: r.ttsQueueMs ?? null,
					ttfaMs: r.ttfaMs ?? null,
					totalMs: r.totalMs ?? null,
					sttExecutorKey: r.sttExecutorKey ?? null,
					llmExecutorKey: r.llmExecutorKey ?? null,
					ttsExecutorKey: r.ttsExecutorKey ?? null,
					sttModelUsed: r.sttModelUsed ?? null,
					llmModelUsed: r.llmModelUsed ?? null,
					ttsVoiceUsed: r.ttsVoiceUsed ?? null,
					wakeWordModelUsed: r.wakeWordModelUsed ?? null,
					status: r.status ?? null,
					errorStep: r.errorStep ?? null,
					errorMessage: r.errorMessage ?? null,
					domiaSnapshot: r.domiaSnapshot ?? null,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
				}
				tx.insert(interactionTrace)
					.values(values)
					.onConflictDoUpdate({ target: interactionTrace.id, set: values })
					.run()
			}
			for (const r of data.emotionEvents) {
				const values = {
					id: r.id,
					sourceDomiaKey: domiaKey,
					cause: r.cause ?? null,
					delta: r.delta ?? null,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
				}
				tx.insert(emotionEvent)
					.values(values)
					.onConflictDoUpdate({ target: emotionEvent.id, set: values })
					.run()
			}
			for (const r of data.facts) {
				const values = {
					id: r.id,
					sourceDomiaKey: domiaKey,
					subject: r.subject ?? null,
					relation: r.relation ?? null,
					value: r.value ?? null,
					confidence: r.confidence ?? null,
					sourceInteractionId: r.sourceInteractionId ?? null,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
				}
				tx.insert(memoryFact)
					.values(values)
					.onConflictDoUpdate({
						target: memoryFact.id,
						set: {
							subject: values.subject,
							relation: values.relation,
							value: values.value,
							confidence: values.confidence,
							sourceInteractionId: values.sourceInteractionId,
							updatedAt: values.updatedAt,
						},
					})
					.run()
			}
		})
	},
}

export default dbAdapter
