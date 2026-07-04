import type { InteractionTraceRow } from "@domia-app/db"
import type { IncompleteReason } from "@/types/conversations"

export const getIncompleteReason = (
	trace: InteractionTraceRow,
): IncompleteReason | null => {
	if (trace.status === "aborted")
		return {
			title: "Turn aborted before it finished",
			detail:
				"It was interrupted — a barge-in or a newer turn started on this Domia (one conversation runs at a time), or it was cancelled. The captured audio is kept, but the turn did not complete, so some later stages (transcript, reply, or audio) may be missing.",
		}
	if (trace.status === "failed" || trace.errorMessage)
		return {
			title: trace.errorStep
				? `Turn failed at ${trace.errorStep}`
				: "Turn failed",
			detail:
				trace.errorMessage ??
				"The pipeline hit an error before producing a reply.",
		}
	if (trace.inputType === "VOICE" && !trace.sttResult)
		return {
			title: "Empty transcription",
			detail:
				"Speech-to-text produced no text — likely silence, a very short utterance, or an audio issue. Without a transcript the LLM and TTS stages don't run.",
		}
	if (!trace.llmResponse)
		return {
			title: "No reply produced",
			detail: "The model didn't return a response for this turn.",
		}
	return null
}
