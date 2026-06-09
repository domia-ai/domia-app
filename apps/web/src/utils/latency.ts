import type { InteractionTraceRow } from "@domia-app/db"
import type {
	LatencyBreakdown,
	LatencyStep,
	LatencyStepKey,
} from "@/types/conversations"

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
