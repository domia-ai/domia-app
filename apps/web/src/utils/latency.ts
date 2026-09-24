import type { InteractionTraceRow } from "@domia-app/db"
import {
	PERCEIVED_LADDER_FIELDS,
	PERCEIVED_LADDER_ORDER,
} from "@/constants/latency"
import type {
	LatencyBreakdown,
	LatencyStep,
	LatencyStepKey,
} from "@/types/conversations"
import type {
	LatencyRatioBand,
	PerceivedLadder,
	PerceivedLadderStep,
	PerceivedLatencySource,
} from "@/types/latency"

const STEP_LABELS: Record<LatencyStepKey, string> = {
	stt: "Speech-to-text",
	llm: "LLM",
	tts: "Text-to-speech",
}

export const buildLatency = (
	trace: InteractionTraceRow,
): LatencyBreakdown | null => {
	const stt = trace.sttMs ?? 0
	const llm = trace.llmMs ?? 0
	const tts = trace.ttsMs ?? 0
	const stageSum = stt + llm + tts
	const totalMs = trace.totalMs ?? (stageSum > 0 ? stageSum : null)
	if (totalMs == null) return null

	const delegated = llm === 0 && tts === 0 && stt > 0
	const base = Math.max(totalMs, stageSum, 1)

	const steps: LatencyStep[] = (
		[
			["stt", stt],
			["llm", llm],
			["tts", tts],
		] as const
	)
		.filter(([, ms]) => ms > 0)
		.map(([key, ms]) => ({
			key,
			label: STEP_LABELS[key],
			ms,
			pct: (ms / base) * 100,
		}))

	return {
		steps,
		totalMs,
		ttfaMs: trace.ttfaMs && trace.ttfaMs > 0 ? trace.ttfaMs : null,
		delegated,
	}
}

export const toPerceivedSource = (
	trace: InteractionTraceRow,
): PerceivedLatencySource => ({
	traceId: trace.traceId,
	speechEndAt: trace.speechEndAt,
	endpointDecisionAt: trace.endpointDecisionAt,
	sttFinalAt: trace.sttFinalAt,
	promptReadyAt: trace.promptReadyAt,
	llmQueuedAt: trace.llmQueuedAt,
	llmFirstTokenAt: trace.llmFirstTokenAt,
	ttsFirstUnitAt: trace.ttsFirstUnitAt,
	audioDeliveredAt: trace.audioDeliveredAt,
	audioAudibleAt: trace.audioAudibleAt,
	eouDelayMs: trace.eouDelayMs,
	transcriptionDelayMs: trace.transcriptionDelayMs,
	fastPathMs: trace.fastPathMs,
	endpointDebounceMs: trace.endpointDebounceMs,
	perceivedTtfaMs: trace.perceivedTtfaMs,
	llmCachedTokens: trace.llmCachedTokens,
	llmFreshTokens: trace.llmFreshTokens,
	implicitFeedback: trace.implicitFeedback,
	heardReply: trace.heardReply,
	llmResponse: trace.llmResponse,
	ttsQueueMs: trace.ttsQueueMs,
	llmFirstSentenceMs: trace.llmFirstSentenceMs,
	agentDecisionMs: trace.agentDecisionMs,
	agentToolMs: trace.agentToolMs,
	agentFinalizeMs: trace.agentFinalizeMs,
})

export const buildPerceivedLadder = (
	source: PerceivedLatencySource,
): PerceivedLadder | null => {
	const points = PERCEIVED_LADDER_ORDER.map((key) => ({
		key,
		at: source[PERCEIVED_LADDER_FIELDS[key]],
	}))
	const present = points.flatMap(({ key, at }) =>
		typeof at === "number" ? [{ key, at }] : [],
	)
	if (present.length < 2) return null

	const totalMs = Math.max(present[present.length - 1].at - present[0].at, 0)
	const base = Math.max(totalMs, 1)
	const steps: PerceivedLadderStep[] = present.map((point, i) => {
		const deltaMs = i === 0 ? null : point.at - present[i - 1].at
		return {
			key: point.key,
			at: point.at,
			deltaMs,
			pct: deltaMs == null ? 0 : Math.max(0, (deltaMs / base) * 100),
		}
	})

	return {
		steps,
		totalMs,
		missing: points
			.filter(({ at }) => typeof at !== "number")
			.map(({ key }) => key),
	}
}

export const latencyBand = (
	value: number | null,
	good: number,
	warn: number,
	higherIsBetter: boolean,
): LatencyRatioBand => {
	if (value == null) return "idle"
	if (higherIsBetter)
		return value >= good ? "good" : value >= warn ? "warn" : "bad"
	return value <= good ? "good" : value <= warn ? "warn" : "bad"
}

export const ratioOf = (part: number, whole: number): number | null =>
	whole > 0 ? part / whole : null
