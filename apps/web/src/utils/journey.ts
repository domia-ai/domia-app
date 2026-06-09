import type { InteractionTraceRow } from "@domia-app/db"
import type {
	ExecutionJourneyStep,
	LatencyStepKey,
} from "@/types/conversations"

export const humanizeDomiaKey = (key: string): string => {
	const stripped = key.replace(/^DOMIA[_-]/i, "")
	return stripped.length > 0 ? stripped.toLowerCase() : key
}

export const buildJourney = (
	trace: InteractionTraceRow,
	originKey: string,
): ExecutionJourneyStep[] => {
	const steps: [LatencyStepKey, string | null][] = [
		["stt", trace.sttExecutorKey],
		["llm", trace.llmExecutorKey],
		["tts", trace.ttsExecutorKey],
	]
	return steps
		.filter(([, key]) => key != null)
		.map(([step, key]) => ({
			step,
			executorKey: key as string,
			executorName: humanizeDomiaKey(key as string),
			local: key === originKey,
		}))
}
