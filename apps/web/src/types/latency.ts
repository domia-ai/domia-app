import type { z } from "zod"
import type { InteractionTraceRow } from "@domia-app/db"
import type { nodeLatencyStatsSchema } from "@/schemas/latency"

export type LatencyPercentiles = {
	count: number
	p50: number | null
	p90: number | null
	min: number | null
	max: number | null
}

export type SpeculationStats = {
	handedOff: number
	wastedFirstUnit: number
	discarded: number
	wasteRate: number
}

export type TwoTierStats = {
	prefills: number
	cancelled: number
	reused: number
	reprefilled: number
}

export type BargeInStats = {
	resumed: number
	escalated: number
	recoveryRate: number
}

export type WakeVerifierStats = {
	accepted: number
	rejected: number
	failedOpen: number
	rejectRate: number
}

export type NodeLatencyStats = z.infer<typeof nodeLatencyStatsSchema>

export type LatencyStageKey =
	| "ttfa"
	| "perceivedTtfa"
	| "stt"
	| "llm"
	| "llmQueue"
	| "tts"
	| "ttsFirstChunk"
	| "rssMb"

export type LatencyStageUnit = "ms" | "mb"

export type LatencyStageMeta = {
	key: LatencyStageKey
	label: () => string
	unit: LatencyStageUnit
}

export type LatencyRatioKey =
	| "speculation"
	| "bargeIn"
	| "twoTier"
	| "wakeVerifier"

export type LatencyRatioBand = "idle" | "good" | "warn" | "bad"

export type LatencyRatioTile = {
	key: LatencyRatioKey
	label: string
	hint: string
	value: number | null
	band: LatencyRatioBand
	detail: string
}

export type LatencySatelliteRow = {
	satelliteId: string
	name: string
	percentiles: LatencyPercentiles
}

export type LatencyStatsSummary = {
	sampleSize: number
	stages: Record<LatencyStageKey, LatencyPercentiles>
	speculation: SpeculationStats
	bargeIn: BargeInStats
	twoTier: TwoTierStats
	wakeVerifier: WakeVerifierStats
}

export type LatencyStatsView = {
	stats: LatencyStatsSummary
	satellites: LatencySatelliteRow[]
}

export type LatencyPanelProps = {
	domiaKey: string
	online: boolean
}

export type PerceivedLadderStepKey =
	| "speechEnd"
	| "sttFinal"
	| "llmFirstToken"
	| "ttsFirstUnit"
	| "audioAudible"

export type PerceivedLadderStep = {
	key: PerceivedLadderStepKey
	at: number
	deltaMs: number | null
	pct: number
}

export type PerceivedLadder = {
	steps: PerceivedLadderStep[]
	totalMs: number
	missing: PerceivedLadderStepKey[]
}

export type PerceivedLatencySource = {
	traceId: string | null
	speechEndAt: number | null
	endpointDecisionAt: number | null
	sttFinalAt: number | null
	promptReadyAt: number | null
	llmQueuedAt: number | null
	llmFirstTokenAt: number | null
	ttsFirstUnitAt: number | null
	audioDeliveredAt: number | null
	audioAudibleAt: number | null
	eouDelayMs: number | null
	transcriptionDelayMs: number | null
	fastPathMs: number | null
	endpointDebounceMs: number | null
	perceivedTtfaMs: number | null
	llmCachedTokens: number | null
	llmFreshTokens: number | null
	implicitFeedback: string | null
	heardReply: string | null
	llmResponse: string | null
	ttsQueueMs: number | null
	llmFirstSentenceMs: number | null
	agentDecisionMs: number | null
	agentToolMs: number | null
	agentFinalizeMs: number | null
}

export type PerceivedLadderOrigin = "live" | "archived" | "unavailable"

export type InteractionLadderInput = {
	domiaKey: string
	interactionId: string
}

export type PerceivedLatencyCardProps = {
	trace: InteractionTraceRow
}
