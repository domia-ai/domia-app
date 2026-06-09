import type { FlowKey } from "@/types/conversations"

export const deriveFlow = (
	inputType: string | null,
	responseType: string | null,
): FlowKey => {
	const voiceIn = inputType === "VOICE"
	const voiceOut = responseType === "voice"
	if (voiceIn && voiceOut) return "s2s"
	if (!voiceIn && !voiceOut) return "t2t"
	if (!voiceIn && voiceOut) return "t2s"
	return "v2t"
}
