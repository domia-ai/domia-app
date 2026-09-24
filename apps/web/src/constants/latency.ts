import { m } from "@/paraglide/messages"
import type {
	LatencyRatioBand,
	LatencyStageMeta,
	PerceivedLadderStepKey,
	PerceivedLatencySource,
} from "@/types/latency"

export const LATENCY_REFETCH_MS = 30_000

export const LATENCY_SAMPLE_WINDOW = 100

export const LATENCY_STAGES: readonly LatencyStageMeta[] = [
	{ key: "ttfa", label: m.lat_stage_ttfa, unit: "ms" },
	{ key: "perceivedTtfa", label: m.lat_stage_perceived_ttfa, unit: "ms" },
	{ key: "stt", label: m.lat_stage_stt, unit: "ms" },
	{ key: "llm", label: m.lat_stage_llm, unit: "ms" },
	{ key: "llmQueue", label: m.lat_stage_llm_queue, unit: "ms" },
	{ key: "tts", label: m.lat_stage_tts, unit: "ms" },
	{ key: "ttsFirstChunk", label: m.lat_stage_tts_first_chunk, unit: "ms" },
	{ key: "rssMb", label: m.lat_stage_rss, unit: "mb" },
]

export const LATENCY_BAND_CLASS: Record<LatencyRatioBand, string> = {
	idle: "border-border text-muted-foreground",
	good: "border-emerald-500/40 text-emerald-700 dark:text-emerald-400",
	warn: "border-amber-500/40 text-amber-700 dark:text-amber-400",
	bad: "border-destructive/40 text-destructive",
}

export const SPECULATION_WASTE_GOOD = 0.2
export const SPECULATION_WASTE_WARN = 0.4
export const BARGE_IN_RECOVERY_GOOD = 0.8
export const BARGE_IN_RECOVERY_WARN = 0.5
export const TWO_TIER_REUSE_GOOD = 0.6
export const TWO_TIER_REUSE_WARN = 0.3
export const WAKE_VERIFIER_REJECT_GOOD = 0.3
export const WAKE_VERIFIER_REJECT_WARN = 0.6

export const PERCEIVED_LADDER_FIELDS: Record<
	PerceivedLadderStepKey,
	keyof PerceivedLatencySource
> = {
	speechEnd: "speechEndAt",
	sttFinal: "sttFinalAt",
	llmFirstToken: "llmFirstTokenAt",
	ttsFirstUnit: "ttsFirstUnitAt",
	audioAudible: "audioAudibleAt",
}

export const PERCEIVED_LADDER_ORDER: readonly PerceivedLadderStepKey[] = [
	"speechEnd",
	"sttFinal",
	"llmFirstToken",
	"ttsFirstUnit",
	"audioAudible",
]

export const PERCEIVED_LADDER_LABELS: Record<
	PerceivedLadderStepKey,
	() => string
> = {
	speechEnd: m.ledger_step_speech_end,
	sttFinal: m.ledger_step_stt_final,
	llmFirstToken: m.ledger_step_llm_first_token,
	ttsFirstUnit: m.ledger_step_tts_first_unit,
	audioAudible: m.ledger_step_audio_audible,
}

export const PERCEIVED_SECONDARY_FIELDS: readonly {
	field: keyof PerceivedLatencySource
	label: () => string
}[] = [
	{ field: "ttsQueueMs", label: m.ledger_secondary_tts_queue },
	{ field: "llmFirstSentenceMs", label: m.ledger_secondary_llm_first_sentence },
	{ field: "agentDecisionMs", label: m.ledger_secondary_agent_decision },
	{ field: "agentToolMs", label: m.ledger_secondary_agent_tool },
	{ field: "agentFinalizeMs", label: m.ledger_secondary_agent_finalize },
]
