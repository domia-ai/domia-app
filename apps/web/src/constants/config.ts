import { m } from "@/paraglide/messages"
import { CHARACTER_ENUM_FIELDS, CHARACTER_TAG_FIELDS } from "@/constants/mind"
import type {
	ArchetypePreset,
	ConfigFieldMetaEntry,
	ConfigOptionLabels,
	ConfigSectionFieldMeta,
	ConfigSectionMeta,
} from "@/types/config"

const MS = "ms"

export const SECTION_META: ConfigSectionMeta[] = [
	{
		id: "character",
		source: "character",
		label: m.config_section_character,
		icon: "user",
		group: "personality",
		kind: "fields",
		description: m.config_section_character_desc,
	},
	{
		id: "tts",
		source: "tts",
		label: m.config_section_tts,
		icon: "audio",
		group: "engines",
		kind: "fields",
		description: m.config_section_tts_desc,
	},
	{
		id: "llm",
		source: "llm",
		label: m.config_section_llm,
		icon: "brain",
		group: "engines",
		kind: "fields",
		description: m.config_section_llm_desc,
	},
	{
		id: "stt",
		source: "stt",
		label: m.config_section_stt,
		icon: "ear",
		group: "engines",
		kind: "fields",
		description: m.config_section_stt_desc,
	},
	{
		id: "wakeWord",
		source: "wakeWord",
		label: m.config_section_wakeword,
		icon: "mic",
		group: "engines",
		kind: "fields",
		description: m.config_section_wakeword_desc,
	},
	{
		id: "playback",
		source: "playback",
		label: m.config_section_playback,
		icon: "speaker",
		group: "engines",
		kind: "fields",
		description: m.config_section_playback_desc,
	},
	{
		id: "capabilities",
		source: "capabilities",
		label: m.config_section_capabilities,
		icon: "toggle",
		group: "behavior",
		kind: "fields",
		description: m.config_section_capabilities_desc,
	},
	{
		id: "modules",
		source: "modules",
		label: m.config_section_modules,
		icon: "boxes",
		group: "behavior",
		kind: "fields",
		description: m.config_section_modules_desc,
	},
	{
		id: "skills",
		label: m.config_section_skills,
		icon: "package",
		group: "behavior",
		kind: "skill",
		description: m.config_section_skills_desc,
	},
	{
		id: "mqttLocal",
		source: "mqttLocal",
		label: m.config_section_mqtt,
		icon: "network",
		group: "system",
		kind: "fields",
		description: m.config_section_mqtt_desc,
	},
	{
		id: "advanced",
		source: "domia",
		label: m.config_section_advanced,
		icon: "sliders",
		group: "system",
		kind: "fields",
		description: m.config_section_advanced_desc,
	},
	{
		id: "health",
		label: m.config_section_health,
		icon: "stethoscope",
		group: "diagnostics",
		kind: "diagnostics",
		description: m.config_section_health_desc,
	},
	{
		id: "models",
		label: m.config_section_models,
		icon: "package",
		group: "diagnostics",
		kind: "models",
		description: m.config_section_models_desc,
	},
]

export const HIDDEN_FIELDS: Record<string, readonly string[]> = {
	domia: [
		"domiaKey",
		"isHosted",
		"localIp",
		"grpcPort",
		"lastSeenAt",
		"peerNodeId",
		"configReloadDrainMs",
		"grpcTls",
		"meshSecretGraceMs",
	],
	mqttLocal: ["type"],
}

const STT_ENGINE_LABELS: ConfigOptionLabels = {
	WHISPER: m.enum_opt_whisper,
	MOONSHINE: m.enum_opt_moonshine,
	ZIPFORMER: m.enum_opt_zipformer,
	PARAKEET: m.enum_opt_parakeet,
	STREAMING_TRANSDUCER: m.enum_opt_streaming_transducer,
	OPENAI_COMPATIBLE: m.enum_opt_openai_compatible,
	NEMO_SPEECH: m.enum_opt_nemo_speech,
}

const TTS_ENGINE_LABELS: ConfigOptionLabels = {
	KOKORO: m.enum_opt_kokoro,
	POCKET: m.enum_opt_pocket,
	VITS: m.enum_opt_vits,
	KITTEN: m.enum_opt_kitten,
	MATCHA: m.enum_opt_matcha,
	SUPERTONIC: m.enum_opt_supertonic,
}

const LLM_ENGINE_LABELS: ConfigOptionLabels = {
	OLLAMA: m.enum_opt_ollama,
	OPENAI_COMPATIBLE: m.enum_opt_openai_compatible,
}

const SKILLS_ROUTING_LABELS: ConfigOptionLabels = {
	"always-agent": m.enum_opt_always_agent,
	"intent-gate": m.enum_opt_intent_gate,
	"embedding-gate": m.enum_opt_embedding_gate,
	"fast-router": m.enum_opt_fast_router,
}

const AGENT_PROMPT_MODE_LABELS: ConfigOptionLabels = {
	lean: m.enum_opt_lean,
	compact: m.enum_opt_compact,
	full: m.enum_opt_full,
}

const AGENT_DECISION_MODE_LABELS: ConfigOptionLabels = {
	native: m.enum_opt_native,
	structured: m.enum_opt_structured,
}

const MATCHER_ENGINE_LABELS: ConfigOptionLabels = {
	lexical: m.enum_opt_lexical,
	semantic: m.enum_opt_semantic,
	hybrid: m.enum_opt_hybrid,
}

const computeProvider: ConfigFieldMetaEntry = {
	key: "provider",
	label: m.config_field_compute,
	hint: m.config_hint_compute_provider,
}

const poolFields: ConfigFieldMetaEntry[] = [
	{ key: "poolWarmWorkers", label: m.config_field_warm_workers },
	{
		key: "poolMaxWorkers",
		label: m.config_field_max_workers,
		hint: m.config_hint_max_workers_auto,
	},
	{ key: "poolAutoScaleEnabled", label: m.config_field_pool_auto_scale },
	{
		key: "poolIdleTimeoutMs",
		label: m.config_field_pool_idle_timeout,
		unit: MS,
	},
	{ key: "poolQueueMaxDepth", label: m.config_field_pool_queue_depth },
	{
		key: "poolQueueTimeoutMs",
		label: m.config_field_pool_queue_timeout,
		unit: MS,
	},
	{
		key: "poolExecutionTimeoutMs",
		label: m.config_field_job_timeout,
		unit: MS,
	},
	{
		key: "workerRecycleAfterJobs",
		label: m.config_field_worker_recycle_after_jobs,
		hint: m.config_hint_worker_recycle_after_jobs,
	},
]

export const FIELD_META: Record<string, ConfigSectionFieldMeta> = {
	domia: {
		primary: [
			{
				key: "sessionIdTimeoutMs",
				label: m.config_field_session_timeout,
				unit: MS,
			},
			{
				key: "memoryWindowTurns",
				label: m.config_field_memory_window,
				unit: "turns",
			},
			{ key: "memoryMaxAgeMs", label: m.config_field_memory_max_age, unit: MS },
			{
				key: "maxConcurrentVoiceReplies",
				label: m.config_field_max_concurrent_replies,
			},
			{
				key: "maxQueuedVoiceReplies",
				label: m.config_field_max_queued_replies,
			},
			{
				key: "voiceQueueTimeoutMs",
				label: m.config_field_voice_queue_timeout,
				unit: MS,
			},
			{
				key: "ownConfigTtlMs",
				label: m.config_field_config_cache_ttl,
				unit: MS,
			},
			{
				key: "warmupOnBoot",
				label: m.config_field_warmup_on_boot,
				hint: m.config_hint_warmup_on_boot,
			},
			{
				key: "heartbeatSignatureRequired",
				label: m.config_field_heartbeat_signature_required,
				hint: m.config_hint_heartbeat_signature_required,
			},
			{ key: "knowledgeMaxChars", label: m.config_field_knowledge_max_chars },
			{
				key: "modelInstallAllowedHosts",
				label: m.config_field_model_install_allowed_hosts,
				kind: "tags",
				hint: m.config_hint_model_install_allowed_hosts,
			},
		],
		advanced: [
			{
				key: "grpcUnaryDeadlineMs",
				label: m.config_field_grpc_unary_deadline,
				unit: MS,
			},
			{
				key: "grpcStreamIdleTimeoutMs",
				label: m.config_field_grpc_stream_idle,
				unit: MS,
			},
			{
				key: "grpcStreamDeadlineMs",
				label: m.config_field_grpc_stream_deadline,
				unit: MS,
			},
			{
				key: "peerStaleAfterMs",
				label: m.config_field_peer_stale_after,
				unit: MS,
				hint: m.config_hint_peer_stale_after,
			},
			{
				key: "benchTurns",
				label: m.config_field_bench_turns,
				unit: "turns",
				hint: m.config_hint_bench_turns,
			},
			{
				key: "benchThresholds",
				label: m.config_field_bench_thresholds,
				kind: "json",
				readOnly: true,
				hint: m.config_hint_bench_thresholds,
			},
		],
	},
	character: {
		primary: [
			...CHARACTER_ENUM_FIELDS.map(
				(f): ConfigFieldMetaEntry => ({ key: f.key, label: f.label }),
			),
			{ key: "language", label: m.config_field_primary_language },
			{ key: "culturalBackground", label: m.config_field_cultural_background },
			{
				key: "emotionExpressionStyle",
				label: m.config_field_emotion_expression_style,
				hint: m.config_hint_emotion_expression_style,
			},
			{
				key: "voiceStyle",
				label: m.config_field_voice_style,
				hint: m.config_hint_voice_style,
			},
			...CHARACTER_TAG_FIELDS.map(
				(f): ConfigFieldMetaEntry => ({
					key: f.key,
					label: f.label,
					kind: "tags",
				}),
			),
		],
		advanced: [
			{
				key: "promptOverrides",
				label: m.config_field_prompt_overrides,
				hint: m.config_hint_prompt_overrides,
				kind: "json",
			},
		],
	},
	tts: {
		primary: [
			{
				key: "engine",
				label: m.config_field_engine,
				optionLabels: TTS_ENGINE_LABELS,
			},
			{
				key: "modelPath",
				label: m.config_field_model,
				kind: "model",
				stage: "tts",
				hint: m.config_hint_tts_model,
			},
			{
				key: "voiceName",
				label: m.config_field_voice,
				hint: m.config_hint_voice,
			},
			{ key: "language", label: m.config_field_language },
			{
				key: "speed",
				label: m.config_field_speed,
				kind: "slider",
				min: 0.5,
				max: 2,
				step: 0.05,
				unit: "×",
			},
			{
				key: "pitch",
				label: m.config_field_pitch,
				kind: "slider",
				min: -1,
				max: 1,
				step: 0.05,
			},
			{
				key: "silenceScale",
				label: m.config_field_pause_length,
				kind: "slider",
				min: 0,
				max: 2,
				step: 0.05,
			},
			{
				key: "streamingEnabled",
				label: m.config_field_stream_while_generating,
			},
			{
				key: "maxNumSentences",
				label: m.config_field_sentences_per_chunk,
				hint: m.config_hint_sentences_per_chunk,
			},
			{
				key: "phraseCacheEnabled",
				label: m.config_field_phrase_cache,
				hint: m.config_hint_phrase_cache,
			},
			{ key: "numThreads", label: m.config_field_threads },
			computeProvider,
		],
		advanced: [
			{
				key: "quantization",
				label: m.config_field_quantization,
				hint: m.config_hint_quantization,
			},
			{
				key: "espeakNgDataPath",
				label: m.config_field_espeak_data_path,
				hint: m.config_hint_espeak_data_path,
			},
			{
				key: "engineConfig",
				label: m.config_field_engine_config,
				hint: m.config_hint_engine_config,
				kind: "json",
			},
			{ key: "phraseCacheEntries", label: m.config_field_phrase_cache_entries },
			{
				key: "phraseCacheMaxChars",
				label: m.config_field_phrase_cache_max_chars,
			},
			{
				key: "pacerEnabled",
				label: m.config_field_pacer,
				hint: m.config_hint_pacer,
			},
			{
				key: "pacerMinRemainingMs",
				label: m.config_field_pacer_min_remaining,
				unit: MS,
			},
			{
				key: "pacerMaxChars",
				label: m.config_field_pacer_max_chars,
				unit: "chars",
			},
			{
				key: "sentenceSoftFlushMinChars",
				label: m.config_field_soft_flush,
				unit: "chars",
			},
			{
				key: "sentenceFirstUnitMaxWords",
				label: m.config_field_first_unit,
				unit: "words",
			},
			{
				key: "sentenceMediumFlushChars",
				label: m.config_field_medium_flush,
				unit: "chars",
			},
			{
				key: "sentenceHardFlushChars",
				label: m.config_field_hard_flush,
				unit: "chars",
			},
			{
				key: "sentenceFirstFlushMaxMs",
				label: m.config_field_first_flush_cap,
				unit: MS,
				hint: m.config_hint_first_flush_cap,
			},
			{
				key: "pipelineMaxQueueDepth",
				label: m.config_field_pipeline_depth,
				unit: "sentences",
				hint: m.config_hint_pipeline_depth,
			},
			{
				key: "pipelineEagerTtsSentences",
				label: m.config_field_eager_synthesis,
				unit: "sentences",
				hint: m.config_hint_eager_synthesis,
			},
			{
				key: "phraseCacheMaxBytes",
				label: m.config_field_phrase_cache_max_bytes,
				unit: "bytes",
			},
			{
				key: "phraseCacheWarmupEnabled",
				label: m.config_field_phrase_cache_warmup_enabled,
			},
			{
				key: "phraseCacheReplyUnitsEnabled",
				label: m.config_field_phrase_cache_reply_units_enabled,
				hint: m.config_hint_phrase_cache_reply_units_enabled,
			},
			{
				key: "sentenceFirstFragmentMaxWords",
				label: m.config_field_sentence_first_fragment_max_words,
				unit: "words",
				hint: m.config_hint_sentence_first_fragment_max_words,
			},
			...poolFields,
		],
	},
	llm: {
		primary: [
			{
				key: "engine",
				label: m.config_field_engine,
				optionLabels: LLM_ENGINE_LABELS,
			},
			{
				key: "baseUrl",
				label: m.config_field_server_url,
				hint: m.config_hint_server_url,
			},
			{
				key: "apiKey",
				label: m.config_field_api_key,
				hint: m.config_hint_api_key,
			},
			{
				key: "modelName",
				label: m.config_field_model,
				kind: "model",
				stage: "llm",
				hint: m.config_hint_llm_model,
			},
			{
				key: "reflectionModelName",
				label: m.config_field_reflection_model,
				kind: "model",
				stage: "llm",
				hint: m.config_hint_reflection_model,
			},
			{
				key: "temperature",
				label: m.config_field_creativity,
				kind: "slider",
				min: 0,
				max: 2,
				step: 0.05,
				hint: m.config_hint_creativity,
			},
			{
				key: "contextWindow",
				label: m.config_field_context_window,
				unit: "tokens",
			},
			{
				key: "numPredict",
				label: m.config_field_max_reply_length,
				unit: "tokens",
			},
			{ key: "llmConcurrency", label: m.config_field_concurrency },
			{
				key: "useCompactPrompt",
				label: m.config_field_compact_prompt,
				hint: m.config_hint_compact_prompt,
			},
			{
				key: "skillsRouting",
				label: m.config_field_skills_routing,
				hint: m.config_hint_skills_routing,
				optionLabels: SKILLS_ROUTING_LABELS,
			},
			{
				key: "agentPromptMode",
				label: m.config_field_skills_prompt_mode,
				hint: m.config_hint_skills_prompt_mode,
				optionLabels: AGENT_PROMPT_MODE_LABELS,
			},
			{
				key: "agentDecisionMode",
				label: m.config_field_agent_decision_mode,
				hint: m.config_hint_agent_decision_mode,
				optionLabels: AGENT_DECISION_MODE_LABELS,
			},
			{
				key: "intentModelName",
				label: m.config_field_intent_model,
				kind: "model",
				stage: "llm",
				hint: m.config_hint_intent_model,
			},
			{
				key: "toolModelName",
				label: m.config_field_tool_model,
				kind: "model",
				stage: "llm",
				hint: m.config_hint_tool_model,
			},
			{
				key: "fastPathEnabled",
				label: m.config_field_fast_path,
				hint: m.config_hint_fast_path,
			},
			{
				key: "authoredSpeechEnabled",
				label: m.config_field_authored_speech,
				hint: m.config_hint_authored_speech,
			},
		],
		advanced: [
			{
				key: "keepAliveMs",
				label: m.config_field_keep_alive,
				unit: MS,
				hint: m.config_hint_keep_alive,
			},
			{ key: "streamUsage", label: m.config_field_stream_usage },
			{
				key: "slotAffinityEnabled",
				label: m.config_field_slot_affinity,
				hint: m.config_hint_slot_affinity,
			},
			{ key: "repeatPenalty", label: m.config_field_repeat_penalty },
			{ key: "topK", label: m.config_field_top_k },
			{ key: "minP", label: m.config_field_min_p },
			{ key: "seed", label: m.config_field_seed },
			{
				key: "stopSequences",
				label: m.config_field_stop_sequences,
				kind: "tags",
			},
			{
				key: "toolTemperature",
				label: m.config_field_tool_temperature,
				kind: "slider",
				min: 0,
				max: 2,
				step: 0.05,
			},
			{
				key: "toolNumPredict",
				label: m.config_field_tool_num_predict,
				unit: "tokens",
			},
			{
				key: "matcherEngine",
				label: m.config_field_matcher_engine,
				hint: m.config_hint_matcher_engine,
				optionLabels: MATCHER_ENGINE_LABELS,
			},
			{
				key: "matcherSemanticThreshold",
				label: m.config_field_matcher_semantic_threshold,
				kind: "slider",
				min: 0,
				max: 1,
				step: 0.01,
			},
			{ key: "matcherRrfK", label: m.config_field_matcher_rrf_k },
			{ key: "matcherCascadeExit", label: m.config_field_matcher_cascade_exit },
			{
				key: "embedBackend",
				label: m.config_field_embed_backend,
				hint: m.config_hint_embed_backend,
			},
			{
				key: "embedModelPath",
				label: m.config_field_embed_model_path,
				kind: "model",
				stage: "embed",
			},
			{
				key: "embeddingModelName",
				label: m.config_field_embedding_model,
				hint: m.config_hint_embedding_model,
			},
			{
				key: "intentEmbedThreshold",
				label: m.config_field_intent_embed_threshold,
				kind: "slider",
				min: 0,
				max: 1,
				step: 0.01,
			},
			{
				key: "descriptorRoutingEnabled",
				label: m.config_field_descriptor_routing,
				hint: m.config_hint_descriptor_routing,
			},
			{
				key: "agentMaxSteps",
				label: m.config_field_agent_max_steps,
				hint: m.config_hint_agent_max_steps,
			},
			{
				key: "agentMaxToolCallsPerTurn",
				label: m.config_field_agent_max_tool_calls,
				hint: m.config_hint_agent_max_tool_calls,
			},
			{
				key: "agentBudgetMs",
				label: m.config_field_agent_budget,
				unit: MS,
				hint: m.config_hint_agent_budget,
			},
			{
				key: "agentAckAfterMs",
				label: m.config_field_agent_ack_after,
				unit: MS,
				hint: m.config_hint_agent_ack_after,
			},
			{
				key: "confirmationTtlMs",
				label: m.config_field_confirmation_ttl,
				unit: MS,
				hint: m.config_hint_confirmation_ttl,
			},
			{
				key: "toolShortlistMax",
				label: m.config_field_tool_shortlist_max,
				hint: m.config_hint_tool_shortlist_max,
			},
			{ key: "agentRepeatWarnAt", label: m.config_field_agent_repeat_warn_at },
			{
				key: "agentRepeatBlockAt",
				label: m.config_field_agent_repeat_block_at,
			},
			{
				key: "agentRecentToolsTurns",
				label: m.config_field_agent_recent_tools_turns,
				unit: "turns",
			},
			{
				key: "agentQuestionGuardEnabled",
				label: m.config_field_agent_question_guard,
				hint: m.config_hint_agent_question_guard,
			},
			{
				key: "agentTargetGuardEnabled",
				label: m.config_field_agent_target_guard,
				hint: m.config_hint_agent_target_guard,
			},
			{
				key: "agentReadThenAnswerEnabled",
				label: m.config_field_agent_read_then_answer,
				hint: m.config_hint_agent_read_then_answer,
			},
			{
				key: "toolRequestMaxRetries",
				label: m.config_field_tool_request_max_retries,
			},
			{
				key: "constrainedRepairEnabled",
				label: m.config_field_constrained_repair,
				hint: m.config_hint_constrained_repair,
			},
			{
				key: "fastPathMinCoverage",
				label: m.config_field_fast_path_min_coverage,
				kind: "slider",
				min: 0,
				max: 1,
				step: 0.05,
				hint: m.config_hint_fast_path_min_coverage,
			},
			{
				key: "fastPathCompoundEnabled",
				label: m.config_field_fast_path_compound,
				hint: m.config_hint_fast_path_compound,
			},
			{
				key: "fastPathCompoundMaxTargets",
				label: m.config_field_fast_path_compound_max_targets,
			},
			{
				key: "fastPathMaxUtteranceChars",
				label: m.config_field_fast_path_max_utterance_chars,
				unit: "chars",
			},
			{
				key: "fastPathBlocklistEnabled",
				label: m.config_field_fast_path_blocklist,
				hint: m.config_hint_fast_path_blocklist,
			},
			{
				key: "asyncFollowUpPolicy",
				label: m.config_field_async_follow_up_policy,
				hint: m.config_hint_async_follow_up_policy,
			},
			{
				key: "asyncFollowUpMaxWaitMs",
				label: m.config_field_async_follow_up_max_wait,
				unit: MS,
			},
			{
				key: "intentLlmOnSingleSlot",
				label: m.config_field_intent_llm_single_slot,
				hint: m.config_hint_intent_llm_single_slot,
			},
			{
				key: "slotWaitTimeoutMs",
				label: m.config_field_slot_wait_timeout,
				unit: MS,
				hint: m.config_hint_slot_wait_timeout,
			},
			{ key: "slotWaitPollMs", label: m.config_field_slot_wait_poll, unit: MS },
			{
				key: "llmStreamIdleMs",
				label: m.config_field_llm_stream_idle,
				unit: MS,
			},
			{
				key: "quietAudioPollMs",
				label: m.config_field_quiet_audio_poll,
				unit: MS,
			},
			{
				key: "quietAudioDeadlineMs",
				label: m.config_field_quiet_audio_deadline,
				unit: MS,
			},
			{
				key: "anaphoraMaxAgeMs",
				label: m.config_field_anaphora_max_age,
				unit: MS,
				hint: m.config_hint_anaphora_max_age,
			},
		],
	},
	stt: {
		primary: [
			{
				key: "engine",
				label: m.config_field_engine,
				optionLabels: STT_ENGINE_LABELS,
			},
			{
				key: "modelPath",
				label: m.config_field_model,
				kind: "model",
				stage: "stt",
				hint: m.config_hint_stt_model,
			},
			{
				key: "baseUrl",
				label: m.config_field_server_url,
				hint: m.config_hint_server_url,
			},
			{
				key: "apiKey",
				label: m.config_field_api_key,
				hint: m.config_hint_api_key,
			},
			{ key: "modelName", label: m.config_field_model_name },
			{ key: "language", label: m.config_field_language },
			{
				key: "enableEndpoint",
				label: m.config_field_endpoint_detection,
				hint: m.config_hint_endpoint_detection,
			},
			{ key: "timeoutMs", label: m.config_field_job_timeout, unit: MS },
			{ key: "numThreads", label: m.config_field_threads },
			computeProvider,
		],
		advanced: [
			{
				key: "quantization",
				label: m.config_field_quantization,
				hint: m.config_hint_quantization,
			},
			{
				key: "decodePaddingMs",
				label: m.config_field_decode_padding,
				unit: MS,
			},
			{
				key: "partialAtEndpointEnabled",
				label: m.config_field_partial_at_endpoint,
				hint: m.config_hint_partial_at_endpoint,
			},
			{
				key: "rule1MinTrailingSilence",
				label: m.config_field_rule1_trailing_silence,
				unit: "s",
				hint: m.config_hint_rule1_trailing_silence,
			},
			{
				key: "rule2MinTrailingSilence",
				label: m.config_field_rule2_trailing_silence,
				unit: "s",
				hint: m.config_hint_rule2_trailing_silence,
			},
			{
				key: "rule3MinUtteranceLength",
				label: m.config_field_rule3_min_utterance,
				unit: "s",
				hint: m.config_hint_rule3_min_utterance,
			},
			{ key: "silenceThreshold", label: m.config_field_silence_threshold },
			{ key: "bufferSize", label: m.config_field_buffer_size },
			{
				key: "maxConcurrentStreamingSessions",
				label: m.config_field_max_streaming_sessions,
			},
			{
				key: "sessionIdleTimeoutMs",
				label: m.config_field_session_idle_timeout,
				unit: MS,
			},
			...poolFields,
		],
	},
	wakeWord: {
		primary: [
			{ key: "engine", label: m.config_field_engine },
			{
				key: "wakeWord",
				label: m.config_field_keyword,
				hint: m.config_hint_keyword,
			},
			{
				key: "sensitivity",
				label: m.config_field_keyword_boost,
				kind: "slider",
				min: 0.5,
				max: 3,
				step: 0.1,
				hint: m.config_hint_keyword_boost,
			},
			{
				key: "threshold",
				label: m.config_field_detection_threshold,
				kind: "slider",
				min: 0.05,
				max: 1,
				step: 0.05,
				hint: m.config_hint_detection_threshold,
			},
			{ key: "cooldown", label: m.config_field_cooldown, unit: "s" },
			{
				key: "customModelPath",
				label: m.config_field_wake_model,
				kind: "model",
				stage: "wakeWord",
			},
			{
				key: "vadModelPath",
				label: m.config_field_vad_model,
				kind: "model",
				stage: "vad",
			},
			{
				key: "vadThreshold",
				label: m.config_field_vad_threshold,
				kind: "slider",
				min: 0.1,
				max: 0.9,
				step: 0.05,
			},
			{
				key: "vadMinSilenceS",
				label: m.config_field_min_silence,
				unit: "s",
				hint: m.config_hint_min_silence,
			},
			{
				key: "vadEndOfSpeechMs",
				label: m.config_field_end_of_speech,
				unit: MS,
				hint: m.config_hint_end_of_speech,
			},
			{
				key: "followUpWindowMs",
				label: m.config_field_follow_up_window,
				unit: MS,
				hint: m.config_hint_follow_up_window,
			},
			{
				key: "bargeInEnabled",
				label: m.config_field_barge_in,
				hint: m.config_hint_barge_in,
			},
			{
				key: "speculativeSilenceMs",
				label: m.config_field_speculative_commit,
				unit: MS,
				hint: m.config_hint_speculative_commit,
			},
			{
				key: "turnDetectorEngine",
				label: m.config_field_turn_detector_engine,
				hint: m.config_hint_turn_detector_engine,
			},
			{
				key: "acousticEndpointingEnabled",
				label: m.config_field_acoustic_endpointing,
				hint: m.config_hint_acoustic_endpointing,
			},
			{ key: "numThreads", label: m.config_field_threads },
			{ ...computeProvider, label: m.config_field_provider },
		],
		advanced: [
			{ key: "framework", label: m.config_field_wake_framework },
			{ key: "model", label: m.config_field_wake_model_id },
			{
				key: "quantization",
				label: m.config_field_quantization,
				hint: m.config_hint_quantization,
			},
			{ key: "vadEngine", label: m.config_field_vad_engine },
			{
				key: "turnDetectorModelPath",
				label: m.config_field_turn_detector_model,
				kind: "model",
				stage: "turnDetector",
			},
			{
				key: "acousticEndpointCompleteThreshold",
				label: m.config_field_acoustic_complete_threshold,
				kind: "slider",
				min: 0,
				max: 1,
				step: 0.01,
			},
			{
				key: "acousticGateCooldownMs",
				label: m.config_field_acoustic_gate_cooldown,
				unit: MS,
			},
			{
				key: "acousticMaxHoldMs",
				label: m.config_field_acoustic_max_hold,
				unit: MS,
			},
			{
				key: "acousticTailKeepMs",
				label: m.config_field_acoustic_tail_keep,
				unit: MS,
			},
			{
				key: "acousticLocalMaxHoldMs",
				label: m.config_field_acoustic_local_max_hold,
				unit: MS,
			},
			{
				key: "semanticEndpointingEnabled",
				label: m.config_field_semantic_endpointing,
				hint: m.config_hint_semantic_endpointing,
			},
			{
				key: "endpointCompleteMs",
				label: m.config_field_endpoint_complete,
				unit: MS,
				hint: m.config_hint_endpoint_complete,
			},
			{
				key: "endpointIncompleteMs",
				label: m.config_field_endpoint_incomplete,
				unit: MS,
				hint: m.config_hint_endpoint_incomplete,
			},
			{ key: "endpointWaitMs", label: m.config_field_endpoint_wait, unit: MS },
			{
				key: "dynamicEndpointingEnabled",
				label: m.config_field_dynamic_endpointing,
				hint: m.config_hint_dynamic_endpointing,
			},
			{
				key: "dynamicEndpointMinMs",
				label: m.config_field_dynamic_endpoint_min,
				unit: MS,
			},
			{
				key: "dynamicEndpointMaxMs",
				label: m.config_field_dynamic_endpoint_max,
				unit: MS,
			},
			{
				key: "dynamicEndpointAlpha",
				label: m.config_field_dynamic_endpoint_alpha,
				kind: "slider",
				min: 0,
				max: 1,
				step: 0.01,
			},
			{
				key: "dynamicEndpointMargin",
				label: m.config_field_dynamic_endpoint_margin,
			},
			{
				key: "speculativeTtsEnabled",
				label: m.config_field_speculative_tts,
				hint: m.config_hint_speculative_tts,
			},
			{
				key: "speculateWithSkills",
				label: m.config_field_speculate_with_skills,
				hint: m.config_hint_speculate_with_skills,
			},
			{
				key: "speculationSkillGateMaxScore",
				label: m.config_field_speculation_skill_gate,
				kind: "slider",
				min: 0,
				max: 1,
				step: 0.01,
			},
			{
				key: "satelliteSpeculationEnabled",
				label: m.config_field_satellite_speculation,
				hint: m.config_hint_satellite_speculation,
			},
			{
				key: "pauseBargeInEnabled",
				label: m.config_field_pause_barge_in,
				hint: m.config_hint_pause_barge_in,
			},
			{
				key: "falseInterruptionTimeoutMs",
				label: m.config_field_false_interruption_timeout,
				unit: MS,
				hint: m.config_hint_false_interruption_timeout,
			},
			{ key: "bargeInMinRms", label: m.config_field_barge_in_min_rms },
			{
				key: "echoSuppressEnabled",
				label: m.config_field_echo_suppress,
				hint: m.config_hint_echo_suppress,
			},
			{
				key: "echoSuppressMarginMs",
				label: m.config_field_echo_suppress_margin,
				unit: MS,
			},
			{
				key: "suppressWakeWhilePeerSpeaks",
				label: m.config_field_suppress_wake_peer_speaks,
				hint: m.config_hint_suppress_wake_peer_speaks,
			},
			{
				key: "sharedMicStreamEnabled",
				label: m.config_field_shared_mic_stream,
				hint: m.config_hint_shared_mic_stream,
			},
			{
				key: "followUpLeadPadMs",
				label: m.config_field_follow_up_lead_pad,
				unit: MS,
				hint: m.config_hint_follow_up_lead_pad,
			},
			{ key: "inputDeviceIndex", label: m.config_field_input_device_index },
			{ key: "sampleRate", label: m.config_field_sample_rate, unit: "Hz" },
			{ key: "bitsPerSample", label: m.config_field_bits_per_sample },
			{ key: "channels", label: m.config_field_channels },
			{ key: "maxRecordingMs", label: m.config_field_max_recording, unit: MS },
			{
				key: "twoTierEndpointEnabled",
				label: m.config_field_two_tier_endpoint_enabled,
				hint: m.config_hint_two_tier_endpoint_enabled,
			},
			{
				key: "twoTierEagerMinPartialChars",
				label: m.config_field_two_tier_eager_min_partial_chars,
				unit: "chars",
			},
			{
				key: "twoTierPrefillIdleGuardMs",
				label: m.config_field_two_tier_prefill_idle_guard_ms,
				unit: MS,
			},
			{
				key: "twoTierResumeGraceMs",
				label: m.config_field_two_tier_resume_grace_ms,
				unit: MS,
			},
			{
				key: "twoTierMaxEagerPrefills",
				label: m.config_field_two_tier_max_eager_prefills,
			},
			{
				key: "aecEnabled",
				label: m.config_field_aec_enabled,
				hint: m.config_hint_aec_enabled,
			},
			{ key: "aecBackend", label: m.config_field_aec_backend },
			{ key: "aecMethod", label: m.config_field_aec_method },
			{
				key: "aecSourceMaster",
				label: m.config_field_aec_source_master,
				hint: m.config_hint_aec_source_master,
			},
			{
				key: "aecSinkMaster",
				label: m.config_field_aec_sink_master,
				hint: m.config_hint_aec_sink_master,
			},
			{ key: "aecSourceName", label: m.config_field_aec_source_name },
			{ key: "aecSinkName", label: m.config_field_aec_sink_name },
			{
				key: "aecSetDefaultDevices",
				label: m.config_field_aec_set_default_devices,
			},
			{
				key: "denoiseEnabled",
				label: m.config_field_denoise_enabled,
				hint: m.config_hint_denoise_enabled,
			},
			{ key: "denoiseEngine", label: m.config_field_denoise_engine },
			{
				key: "denoiseModelPath",
				label: m.config_field_denoise_model_path,
			},
			{ key: "denoiseNumThreads", label: m.config_field_denoise_num_threads },
			{ key: "denoiseProvider", label: m.config_field_denoise_provider },
			{
				key: "echoResidualGateEnabled",
				label: m.config_field_echo_residual_gate_enabled,
				hint: m.config_hint_echo_residual_gate_enabled,
			},
			{
				key: "echoResidualMinRatio",
				label: m.config_field_echo_residual_min_ratio,
				kind: "slider",
				min: 0,
				max: 1,
				step: 0.01,
			},
			{
				key: "echoResidualWindowMs",
				label: m.config_field_echo_residual_window_ms,
				unit: MS,
			},
			{
				key: "echoResidualMaxDelayMs",
				label: m.config_field_echo_residual_max_delay_ms,
				unit: MS,
			},
			{
				key: "echoResidualMinRms",
				label: m.config_field_echo_residual_min_rms,
			},
			{
				key: "echoResidualMinFrames",
				label: m.config_field_echo_residual_min_frames,
				unit: "frames",
			},
			{
				key: "stopWordAbortEnabled",
				label: m.config_field_stop_word_abort_enabled,
				hint: m.config_hint_stop_word_abort_enabled,
			},
			{
				key: "stopWordMaxWords",
				label: m.config_field_stop_word_max_words,
				unit: "words",
			},
			{
				key: "wakeVerifier",
				label: m.config_field_wake_verifier,
				hint: m.config_hint_wake_verifier,
			},
			{
				key: "wakeVerifierWindowMs",
				label: m.config_field_wake_verifier_window_ms,
				unit: MS,
			},
			{
				key: "wakeVerifierMinRms",
				label: m.config_field_wake_verifier_min_rms,
			},
			{
				key: "wakeVerifierMinSpeechMs",
				label: m.config_field_wake_verifier_min_speech_ms,
				unit: MS,
			},
			{
				key: "wakeVerifierMinScore",
				label: m.config_field_wake_verifier_min_score,
				kind: "slider",
				min: 0,
				max: 1,
				step: 0.01,
			},
		],
	},
	playback: {
		primary: [
			{ key: "engine", label: m.config_field_engine },
			{
				key: "volume",
				label: m.config_field_volume,
				kind: "slider",
				min: 0,
				max: 100,
				step: 1,
			},
			{ key: "outputDevice", label: m.config_field_output_device },
			{ key: "streamingEnabled", label: m.config_field_stream_audio },
			{
				key: "feedbackSoundsEnabled",
				label: m.config_field_feedback_sounds,
				hint: m.config_hint_feedback_sounds,
			},
			{ key: "ackSoundEnabled", label: m.config_field_ack_sound },
			{ key: "doneSoundEnabled", label: m.config_field_done_sound },
			{ key: "errorSoundEnabled", label: m.config_field_error_sound },
			{ key: "thinkingSoundEnabled", label: m.config_field_thinking_sound },
			{ key: "endpointSoundEnabled", label: m.config_field_endpoint_sound },
		],
		advanced: [
			{
				key: "pauseEnabled",
				label: m.config_field_playback_pause,
				hint: m.config_hint_playback_pause,
			},
			{
				key: "wordLevelHeardEnabled",
				label: m.config_field_word_level_heard,
				hint: m.config_hint_word_level_heard,
			},
			{
				key: "watchdogGraceMs",
				label: m.config_field_watchdog_grace,
				unit: MS,
			},
			{
				key: "truncationReplayEnabled",
				label: m.config_field_truncation_replay,
				hint: m.config_hint_truncation_replay,
			},
			{
				key: "truncationReplayThresholdMs",
				label: m.config_field_truncation_replay_threshold,
				kind: "slider",
				min: 0,
				max: 3000,
				step: 50,
				hint: m.config_hint_truncation_replay_threshold,
			},
			{ key: "ackSoundPath", label: m.config_field_ack_sound_path },
			{ key: "doneSoundPath", label: m.config_field_done_sound_path },
			{ key: "errorSoundPath", label: m.config_field_error_sound_path },
			{ key: "thinkingSoundPath", label: m.config_field_thinking_sound_path },
			{ key: "endpointSoundPath", label: m.config_field_endpoint_sound_path },
		],
	},
	capabilities: {
		primary: [
			{
				key: "wakeword",
				label: m.enum_capability_wakeword,
				hint: m.config_hint_cap_wakeword,
			},
			{
				key: "record",
				label: m.enum_capability_record,
				hint: m.config_hint_cap_record,
			},
			{ key: "stt", label: m.enum_capability_stt },
			{ key: "llm", label: m.enum_capability_llm },
			{ key: "tts", label: m.enum_capability_tts },
			{ key: "playback", label: m.enum_capability_playback },
			{ key: "intentDetection", label: m.enum_capability_intent_detection },
			{ key: "intentExecution", label: m.enum_capability_intent_execution },
			{ key: "promptGeneration", label: m.enum_capability_prompt_generation },
		],
		advanced: [],
	},
	modules: {
		primary: [
			{
				key: "emotionEngine",
				label: m.mind_module_emotion_engine,
				hint: m.mind_module_emotion_engine_hint,
			},
			{
				key: "emotionCapture",
				label: m.config_field_emotion_capture,
				hint: m.config_hint_emotion_capture,
			},
			{
				key: "memoryEngine",
				label: m.mind_module_memory_engine,
				hint: m.mind_module_memory_engine_hint,
			},
			{ key: "factCapture", label: m.config_field_fact_capture },
			{ key: "factRecall", label: m.config_field_fact_recall },
			{
				key: "identityEngine",
				label: m.mind_module_identity_engine,
				hint: m.mind_module_identity_engine_hint,
			},
			{
				key: "skillsEngine",
				label: m.config_field_skills_tools,
				hint: m.config_hint_skills_tools,
			},
			{
				key: "environmentTimeEnabled",
				label: m.config_field_environment_time,
				hint: m.config_hint_environment_time,
			},
			{
				key: "reflectionOnlyWhenIdle",
				label: m.config_field_reflect_only_idle,
			},
			{
				key: "reflectionYieldToVoice",
				label: m.config_field_yield_to_voice,
				hint: m.config_hint_yield_to_voice,
			},
		],
		advanced: [
			{
				key: "reflectionConcurrency",
				label: m.config_field_reflection_concurrency,
			},
			{
				key: "reflectionQueueMaxDepth",
				label: m.config_field_reflection_queue_depth,
			},
			{
				key: "reflectionTimeoutMs",
				label: m.config_field_reflection_timeout,
				unit: MS,
			},
			{
				key: "reflectionIdlePollMs",
				label: m.config_field_reflection_idle_poll,
				unit: MS,
			},
			{
				key: "reflectionIdleGraceMs",
				label: m.config_field_reflection_idle_grace,
				unit: MS,
			},
			{
				key: "reflectionMaxIdleWaitMs",
				label: m.config_field_reflection_max_idle_wait,
				unit: MS,
			},
			{
				key: "reflectionSlotTimeoutMs",
				label: m.config_field_reflection_slot_timeout,
				unit: MS,
			},
			{
				key: "reflectionYieldMaxAttempts",
				label: m.config_field_reflection_yield_max_attempts,
			},
			{
				key: "metricsSampleResources",
				label: m.config_field_metrics_sample_resources,
				hint: m.config_hint_metrics_sample_resources,
			},
			{
				key: "turnEventsPersist",
				label: m.config_field_turn_events_persist,
				hint: m.config_hint_turn_events_persist,
			},
			{
				key: "proactivityEngine",
				label: m.config_field_proactivity_engine,
				hint: m.config_hint_proactivity_engine,
			},
			{
				key: "proactiveIdleNudgeEnabled",
				label: m.config_field_proactive_idle_nudge_enabled,
				hint: m.config_hint_proactive_idle_nudge_enabled,
			},
			{
				key: "proactiveIdleNudgeAfterMs",
				label: m.config_field_proactive_idle_nudge_after_ms,
				unit: MS,
			},
			{
				key: "proactiveIdleNudgeMinIntervalMs",
				label: m.config_field_proactive_idle_nudge_min_interval_ms,
				unit: MS,
			},
			{
				key: "proactiveQuietHoursStart",
				label: m.config_field_proactive_quiet_hours_start,
				hint: m.config_hint_proactive_quiet_hours_start,
			},
			{
				key: "proactiveQuietHoursEnd",
				label: m.config_field_proactive_quiet_hours_end,
				hint: m.config_hint_proactive_quiet_hours_end,
			},
			{
				key: "proactiveMaxPerHour",
				label: m.config_field_proactive_max_per_hour,
			},
			{
				key: "proactiveMaxPerDay",
				label: m.config_field_proactive_max_per_day,
			},
			{
				key: "proactiveChimeEnabled",
				label: m.config_field_proactive_chime_enabled,
				hint: m.config_hint_proactive_chime_enabled,
			},
			{
				key: "proactiveDeferMaxMs",
				label: m.config_field_proactive_defer_max_ms,
				unit: MS,
			},
			{
				key: "proactiveTickMs",
				label: m.config_field_proactive_tick_ms,
				unit: MS,
			},
			{
				key: "proactiveLeaseMs",
				label: m.config_field_proactive_lease_ms,
				unit: MS,
			},
			{
				key: "proactiveMaxAttempts",
				label: m.config_field_proactive_max_attempts,
			},
			{
				key: "proactiveRetryBackoffMs",
				label: m.config_field_proactive_retry_backoff_ms,
				unit: MS,
			},
		],
	},
	mqttLocal: {
		primary: [
			{ key: "host", label: m.config_field_host },
			{ key: "port", label: m.config_field_port },
			{ key: "protocol", label: m.config_field_protocol },
			{ key: "username", label: m.config_field_username },
			{ key: "password", label: m.config_field_password },
			{ key: "qos", label: m.config_field_qos },
			{ key: "topicRoot", label: m.config_field_topic_root },
		],
		advanced: [],
	},
}

export const SECTION_GROUPS = [
	"personality",
	"engines",
	"behavior",
	"system",
	"diagnostics",
] as const

export const SECTION_GROUP_LABELS: Record<
	(typeof SECTION_GROUPS)[number],
	() => string
> = {
	personality: m.config_group_personality,
	engines: m.config_group_engines,
	behavior: m.config_group_behavior,
	system: m.config_group_system,
	diagnostics: m.config_group_diagnostics,
}

export const ARCHETYPE_PRESETS: ArchetypePreset[] = [
	{
		id: "standalone",
		label: m.config_archetype_standalone,
		description: m.config_archetype_standalone_desc,
		capabilities: {
			wakeword: true,
			record: true,
			stt: true,
			llm: true,
			tts: true,
			playback: true,
			intentDetection: true,
			intentExecution: true,
			promptGeneration: true,
		},
	},
	{
		id: "thin-client",
		label: m.config_archetype_thin_client,
		description: m.config_archetype_thin_client_desc,
		capabilities: {
			wakeword: true,
			record: true,
			stt: false,
			llm: false,
			tts: false,
			playback: true,
			intentDetection: false,
			intentExecution: false,
			promptGeneration: false,
		},
	},
	{
		id: "inference-hub",
		label: m.config_archetype_inference_hub,
		description: m.config_archetype_inference_hub_desc,
		capabilities: {
			wakeword: false,
			record: false,
			stt: true,
			llm: true,
			tts: true,
			playback: false,
			intentDetection: true,
			intentExecution: true,
			promptGeneration: true,
		},
	},
]
