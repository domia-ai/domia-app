CREATE TABLE `announcement` (
	`id` text PRIMARY KEY NOT NULL,
	`source_domia_key` text NOT NULL,
	`broadcast_id` text NOT NULL,
	`text` text DEFAULT '' NOT NULL,
	`kind` text NOT NULL,
	`delivery` text NOT NULL,
	`target` text,
	`delivered` integer DEFAULT false NOT NULL,
	`audio_path` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `announcement_source_idx` ON `announcement` (`source_domia_key`);--> statement-breakpoint
CREATE INDEX `announcement_broadcast_idx` ON `announcement` (`broadcast_id`);--> statement-breakpoint
CREATE TABLE `audio_asset` (
	`id` text PRIMARY KEY NOT NULL,
	`source_domia_key` text NOT NULL,
	`interaction_id` text NOT NULL,
	`kind` text NOT NULL,
	`local_path` text NOT NULL,
	`bytes` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audio_asset_interaction_idx` ON `audio_asset` (`interaction_id`);--> statement-breakpoint
CREATE INDEX `audio_asset_source_interaction_idx` ON `audio_asset` (`source_domia_key`,`interaction_id`);--> statement-breakpoint
CREATE TABLE `domia_registry` (
	`domia_key` text PRIMARY KEY NOT NULL,
	`id` text,
	`name` text NOT NULL,
	`node_id` text,
	`is_active` integer DEFAULT true NOT NULL,
	`local_ip` text,
	`grpc_port` integer,
	`http_port` integer,
	`is_hosted` integer DEFAULT true NOT NULL,
	`is_principal` integer DEFAULT false NOT NULL,
	`config_snapshot_json` text,
	`avatar_id` text,
	`avatar_mime` text,
	`last_interaction_at` text,
	`first_seen_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `domia_registry_last_seen_at_idx` ON `domia_registry` (`last_seen_at`);--> statement-breakpoint
CREATE TABLE `emotion_event` (
	`id` text PRIMARY KEY NOT NULL,
	`source_domia_key` text NOT NULL,
	`cause` text,
	`delta` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `emotion_event_source_created_idx` ON `emotion_event` (`source_domia_key`,`created_at`);--> statement-breakpoint
CREATE TABLE `interaction_label` (
	`id` text PRIMARY KEY NOT NULL,
	`interaction_id` text NOT NULL,
	`rating` text,
	`correction` text,
	`tags` text,
	`author` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `interaction_label_interaction_idx` ON `interaction_label` (`interaction_id`);--> statement-breakpoint
CREATE TABLE `interaction_session_trace` (
	`id` text PRIMARY KEY NOT NULL,
	`source_domia_key` text NOT NULL,
	`session_id` text,
	`started_at` text,
	`last_used_at` text,
	`session_id_timeout_ms` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `session_trace_source_updated_idx` ON `interaction_session_trace` (`source_domia_key`,`updated_at`);--> statement-breakpoint
CREATE INDEX `session_trace_last_used_idx` ON `interaction_session_trace` (`last_used_at`);--> statement-breakpoint
CREATE TABLE `interaction_trace` (
	`id` text PRIMARY KEY NOT NULL,
	`source_domia_key` text NOT NULL,
	`interaction_session_trace_id` text,
	`session_id` text,
	`input_type` text,
	`response_type` text,
	`is_active` integer,
	`input_raw` text,
	`input_audio_path` text,
	`wakeword_used` text,
	`stt_result` text,
	`intent_decision` text,
	`intent_ms` integer,
	`agent_decision_ms` integer,
	`agent_tool_ms` integer,
	`agent_finalize_ms` integer,
	`skill_provider_used` text,
	`skill_prompt` text,
	`skill_response` text,
	`llm_prompt` text,
	`llm_response` text,
	`heard_reply` text,
	`tts_engine_used` text,
	`tts_audio_path` text,
	`final_output` text,
	`emotion_snapshot` text,
	`character_snapshot` text,
	`user_emotion_snapshot` text,
	`stt_ms` integer,
	`stt_queue_ms` integer,
	`llm_ms` integer,
	`llm_queue_ms` integer,
	`llm_prompt_tokens` integer,
	`llm_completion_tokens` integer,
	`llm_tokens_per_sec` real,
	`llm_ttft_ms` integer,
	`llm_context_window` integer,
	`llm_finish_reason` text,
	`tool_call_count` integer,
	`tool_error_count` integer,
	`input_audio_ms` integer,
	`tts_ms` integer,
	`tts_queue_ms` integer,
	`ttfa_ms` integer,
	`perceived_ttfa_ms` integer,
	`llm_first_sentence_ms` integer,
	`tts_first_chunk_ms` integer,
	`rss_mb` integer,
	`total_ms` integer,
	`stt_executor_key` text,
	`llm_executor_key` text,
	`tts_executor_key` text,
	`stt_model_used` text,
	`llm_model_used` text,
	`tts_voice_used` text,
	`wake_word_model_used` text,
	`status` text,
	`error_step` text,
	`error_message` text,
	`satellite_id` text,
	`satellite_protocol` text,
	`domia_snapshot` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `interaction_trace_source_created_idx` ON `interaction_trace` (`source_domia_key`,`created_at`);--> statement-breakpoint
CREATE INDEX `interaction_trace_created_idx` ON `interaction_trace` (`created_at`);--> statement-breakpoint
CREATE INDEX `interaction_trace_session_trace_idx` ON `interaction_trace` (`interaction_session_trace_id`);--> statement-breakpoint
CREATE INDEX `interaction_trace_source_updated_idx` ON `interaction_trace` (`source_domia_key`,`updated_at`);--> statement-breakpoint
CREATE TABLE `memory_fact` (
	`id` text PRIMARY KEY NOT NULL,
	`source_domia_key` text NOT NULL,
	`subject` text,
	`relation` text,
	`value` text,
	`confidence` real,
	`kind` text,
	`source_interaction_id` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `memory_fact_source_subject_idx` ON `memory_fact` (`source_domia_key`,`subject`,`relation`);--> statement-breakpoint
CREATE INDEX `memory_fact_source_updated_idx` ON `memory_fact` (`source_domia_key`,`updated_at`);--> statement-breakpoint
CREATE INDEX `memory_fact_interaction_idx` ON `memory_fact` (`source_interaction_id`);--> statement-breakpoint
CREATE TABLE `mind_template` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`config` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `mind_template_name_idx` ON `mind_template` (`name`);--> statement-breakpoint
CREATE TABLE `sync_cursor` (
	`domia_key` text PRIMARY KEY NOT NULL,
	`last_interaction_at` text,
	`last_turn_at` text,
	`last_turn_id` text,
	`last_synced_at` integer
);
--> statement-breakpoint
CREATE TABLE `turn_event` (
	`id` text PRIMARY KEY NOT NULL,
	`source_domia_key` text NOT NULL,
	`interaction_id` text NOT NULL,
	`type` text NOT NULL,
	`seq` integer NOT NULL,
	`ts` integer NOT NULL,
	`origin_domia_key` text,
	`executor_domia_key` text,
	`satellite_id` text,
	`trace_id` text,
	`payload` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `turn_event_interaction_seq_idx` ON `turn_event` (`interaction_id`,`seq`);--> statement-breakpoint
CREATE INDEX `turn_event_source_created_idx` ON `turn_event` (`source_domia_key`,`created_at`);