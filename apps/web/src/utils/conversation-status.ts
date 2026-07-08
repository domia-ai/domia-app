import { m } from "@/paraglide/messages"
import type { InteractionTraceRow } from "@domia-app/db"
import type { IncompleteReason } from "@/types/conversations"

export const getIncompleteReason = (
	trace: InteractionTraceRow,
): IncompleteReason | null => {
	if (trace.status === "aborted")
		return {
			title: m.conv_incomplete_aborted_title(),
			detail: m.conv_incomplete_aborted_detail(),
		}
	if (trace.status === "failed" || trace.errorMessage)
		return {
			title: trace.errorStep
				? m.conv_incomplete_failed_at_title({ step: trace.errorStep })
				: m.conv_incomplete_failed_title(),
			detail: trace.errorMessage ?? m.conv_incomplete_failed_detail(),
		}
	if (trace.inputType === "VOICE" && !trace.sttResult)
		return {
			title: m.conv_incomplete_empty_stt_title(),
			detail: m.conv_incomplete_empty_stt_detail(),
		}
	if (!trace.llmResponse)
		return {
			title: m.conv_incomplete_no_reply_title(),
			detail: m.conv_incomplete_no_reply_detail(),
		}
	return null
}
