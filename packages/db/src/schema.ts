import { sql, relations } from "drizzle-orm"
import {
	sqliteTable,
	text,
	integer,
	real,
	index,
	uniqueIndex,
} from "drizzle-orm/sqlite-core"

type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue }

const DEFAULT_TIMESTAMP = sql`CURRENT_TIMESTAMP`

export const domiaRegistry = sqliteTable(
	"domia_registry",
	{
		domiaKey: text("domia_key").primaryKey(),
		id: text("id"),
		name: text("name").notNull(),
		isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
		localIp: text("local_ip"),
		grpcPort: integer("grpc_port"),
		httpPort: integer("http_port"),
		configSnapshotJson: text("config_snapshot_json"),
		avatarId: text("avatar_id"),
		avatarMime: text("avatar_mime"),
		lastInteractionAt: text("last_interaction_at"),
		firstSeenAt: integer("first_seen_at").notNull(),
		lastSeenAt: integer("last_seen_at").notNull(),
		updatedAt: integer("updated_at").notNull(),
	},
	(t) => [index("domia_registry_last_seen_at_idx").on(t.lastSeenAt)],
)

export const interactionTrace = sqliteTable(
	"interaction_trace",
	{
		id: text("id").primaryKey(),
		sourceDomiaKey: text("source_domia_key").notNull(),
		interactionSessionTraceId: text("interaction_session_trace_id"),
		sessionId: text("session_id"),
		inputType: text("input_type"),
		responseType: text("response_type"),
		isActive: integer("is_active", { mode: "boolean" }),
		inputRaw: text("input_raw"),
		inputAudioPath: text("input_audio_path"),
		wakewordUsed: text("wakeword_used"),
		sttResult: text("stt_result"),
		intentDecision: text("intent_decision"),
		intentMs: integer("intent_ms"),
		skillProviderUsed: text("skill_provider_used"),
		skillPrompt: text("skill_prompt"),
		skillResponse: text("skill_response", { mode: "json" }).$type<JsonValue>(),
		llmPrompt: text("llm_prompt"),
		llmResponse: text("llm_response"),
		heardReply: text("heard_reply"),
		ttsEngineUsed: text("tts_engine_used"),
		ttsAudioPath: text("tts_audio_path"),
		finalOutput: text("final_output"),
		emotionSnapshot: text("emotion_snapshot", {
			mode: "json",
		}).$type<JsonValue>(),
		characterSnapshot: text("character_snapshot", {
			mode: "json",
		}).$type<JsonValue>(),
		userEmotionSnapshot: text("user_emotion_snapshot", {
			mode: "json",
		}).$type<JsonValue>(),
		sttMs: integer("stt_ms"),
		llmMs: integer("llm_ms"),
		ttsMs: integer("tts_ms"),
		ttfaMs: integer("ttfa_ms"),
		perceivedTtfaMs: integer("perceived_ttfa_ms"),
		totalMs: integer("total_ms"),
		sttExecutorKey: text("stt_executor_key"),
		llmExecutorKey: text("llm_executor_key"),
		ttsExecutorKey: text("tts_executor_key"),
		sttModelUsed: text("stt_model_used"),
		llmModelUsed: text("llm_model_used"),
		ttsVoiceUsed: text("tts_voice_used"),
		wakeWordModelUsed: text("wake_word_model_used"),
		status: text("status"),
		errorStep: text("error_step"),
		errorMessage: text("error_message"),
		domiaSnapshot: text("domia_snapshot", { mode: "json" }).$type<JsonValue>(),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(t) => [
		index("interaction_trace_source_created_idx").on(
			t.sourceDomiaKey,
			t.createdAt,
		),
		index("interaction_trace_created_idx").on(t.createdAt),
		index("interaction_trace_session_trace_idx").on(
			t.interactionSessionTraceId,
		),
		index("interaction_trace_source_updated_idx").on(
			t.sourceDomiaKey,
			t.updatedAt,
		),
	],
)

export const interactionSessionTrace = sqliteTable(
	"interaction_session_trace",
	{
		id: text("id").primaryKey(),
		sourceDomiaKey: text("source_domia_key").notNull(),
		sessionId: text("session_id"),
		startedAt: text("started_at"),
		lastUsedAt: text("last_used_at"),
		timeoutMs: integer("session_id_timeout_ms"),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(t) => [
		index("session_trace_source_updated_idx").on(t.sourceDomiaKey, t.updatedAt),
		index("session_trace_last_used_idx").on(t.lastUsedAt),
	],
)

export const emotionEvent = sqliteTable(
	"emotion_event",
	{
		id: text("id").primaryKey(),
		sourceDomiaKey: text("source_domia_key").notNull(),
		cause: text("cause"),
		delta: text("delta", { mode: "json" }).$type<JsonValue>(),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(t) => [
		index("emotion_event_source_created_idx").on(t.sourceDomiaKey, t.createdAt),
	],
)

export const memoryFact = sqliteTable(
	"memory_fact",
	{
		id: text("id").primaryKey(),
		sourceDomiaKey: text("source_domia_key").notNull(),
		subject: text("subject"),
		relation: text("relation"),
		value: text("value"),
		confidence: real("confidence"),
		sourceInteractionId: text("source_interaction_id"),
		createdAt: text("created_at").notNull(),
		updatedAt: text("updated_at").notNull(),
	},
	(t) => [
		index("memory_fact_source_subject_idx").on(
			t.sourceDomiaKey,
			t.subject,
			t.relation,
		),
		index("memory_fact_source_updated_idx").on(t.sourceDomiaKey, t.updatedAt),
		index("memory_fact_interaction_idx").on(t.sourceInteractionId),
	],
)

export const syncCursor = sqliteTable("sync_cursor", {
	domiaKey: text("domia_key").primaryKey(),
	lastInteractionAt: text("last_interaction_at"),
	lastSyncedAt: integer("last_synced_at"),
})

export const audioAsset = sqliteTable(
	"audio_asset",
	{
		id: text("id").primaryKey(),
		sourceDomiaKey: text("source_domia_key").notNull(),
		interactionId: text("interaction_id").notNull(),
		kind: text("kind").notNull(),
		localPath: text("local_path").notNull(),
		bytes: integer("bytes"),
		createdAt: text("created_at").notNull().default(DEFAULT_TIMESTAMP),
	},
	(t) => [
		index("audio_asset_interaction_idx").on(t.interactionId),
		index("audio_asset_source_interaction_idx").on(
			t.sourceDomiaKey,
			t.interactionId,
		),
	],
)

export const interactionLabel = sqliteTable(
	"interaction_label",
	{
		id: text("id").primaryKey(),
		interactionId: text("interaction_id").notNull(),
		rating: text("rating"),
		correction: text("correction"),
		tags: text("tags", { mode: "json" }).$type<string[]>(),
		author: text("author"),
		createdAt: text("created_at").notNull().default(DEFAULT_TIMESTAMP),
		updatedAt: text("updated_at").notNull().default(DEFAULT_TIMESTAMP),
	},
	(t) => [uniqueIndex("interaction_label_interaction_idx").on(t.interactionId)],
)

export const domiaRegistryRelations = relations(domiaRegistry, ({ many }) => ({
	interactions: many(interactionTrace),
	sessions: many(interactionSessionTrace),
	emotionEvents: many(emotionEvent),
	facts: many(memoryFact),
	audioAssets: many(audioAsset),
}))

export const interactionTraceRelations = relations(
	interactionTrace,
	({ one, many }) => ({
		domia: one(domiaRegistry, {
			fields: [interactionTrace.sourceDomiaKey],
			references: [domiaRegistry.domiaKey],
		}),
		session: one(interactionSessionTrace, {
			fields: [interactionTrace.interactionSessionTraceId],
			references: [interactionSessionTrace.id],
		}),
		audioAssets: many(audioAsset),
		labels: many(interactionLabel),
	}),
)

export const interactionSessionTraceRelations = relations(
	interactionSessionTrace,
	({ one, many }) => ({
		domia: one(domiaRegistry, {
			fields: [interactionSessionTrace.sourceDomiaKey],
			references: [domiaRegistry.domiaKey],
		}),
		interactions: many(interactionTrace),
	}),
)

export const emotionEventRelations = relations(emotionEvent, ({ one }) => ({
	domia: one(domiaRegistry, {
		fields: [emotionEvent.sourceDomiaKey],
		references: [domiaRegistry.domiaKey],
	}),
}))

export const memoryFactRelations = relations(memoryFact, ({ one }) => ({
	domia: one(domiaRegistry, {
		fields: [memoryFact.sourceDomiaKey],
		references: [domiaRegistry.domiaKey],
	}),
}))

export const audioAssetRelations = relations(audioAsset, ({ one }) => ({
	domia: one(domiaRegistry, {
		fields: [audioAsset.sourceDomiaKey],
		references: [domiaRegistry.domiaKey],
	}),
	interaction: one(interactionTrace, {
		fields: [audioAsset.interactionId],
		references: [interactionTrace.id],
	}),
}))

export const interactionLabelRelations = relations(
	interactionLabel,
	({ one }) => ({
		interaction: one(interactionTrace, {
			fields: [interactionLabel.interactionId],
			references: [interactionTrace.id],
		}),
	}),
)

export const mindTemplate = sqliteTable(
	"mind_template",
	{
		id: text("id").primaryKey(),
		name: text("name").notNull(),
		description: text("description").notNull().default(""),
		config: text("config", { mode: "json" }).$type<JsonValue>(),
		createdAt: integer("created_at").notNull(),
		updatedAt: integer("updated_at").notNull(),
	},
	(t) => [uniqueIndex("mind_template_name_idx").on(t.name)],
)

export type DomiaRegistryRow = typeof domiaRegistry.$inferSelect
export type DomiaRegistryInsert = typeof domiaRegistry.$inferInsert
export type InteractionTraceRow = typeof interactionTrace.$inferSelect
export type InteractionTraceInsert = typeof interactionTrace.$inferInsert
export type InteractionSessionTraceRow =
	typeof interactionSessionTrace.$inferSelect
export type EmotionEventRow = typeof emotionEvent.$inferSelect
export type EmotionEventInsert = typeof emotionEvent.$inferInsert
export type MemoryFactRow = typeof memoryFact.$inferSelect
export type MemoryFactInsert = typeof memoryFact.$inferInsert
export type SyncCursorRow = typeof syncCursor.$inferSelect
export type AudioAssetRow = typeof audioAsset.$inferSelect
export type AudioAssetInsert = typeof audioAsset.$inferInsert
export type InteractionLabelRow = typeof interactionLabel.$inferSelect
export type InteractionLabelInsert = typeof interactionLabel.$inferInsert
