import { getNodeEndpoint } from "@/services/fleet"
import { nodeChat, nodeVoice, parseInteractionId } from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { ChatExchangeResult, SendMessageInput } from "@/types/chat"

export const sendMessage = async (
	input: SendMessageInput,
): Promise<ActionResult<ChatExchangeResult>> => {
	try {
		const endpoint = await getNodeEndpoint(input.targetDomiaKey)
		if (!endpoint)
			return { ok: false, error: "This Domia has no reachable address" }
		const base = `http://${endpoint.localIp}:${endpoint.httpPort}`

		if (input.kind === "voice") {
			if (!input.audioBase64) return { ok: false, error: "No audio to send" }
			const r = await nodeVoice(base, {
				audioBase64: input.audioBase64,
				speak: input.speak,
			})
			return {
				ok: true,
				data: {
					interactionId: r.interactionId,
					transcript: r.transcript,
					reply: r.reply,
					audioUrl: r.audioUrl,
					timings: r.timings,
				},
			}
		}

		if (!input.text?.trim()) return { ok: false, error: "Message is empty" }
		const r = await nodeChat(base, { text: input.text, speak: input.speak })
		return {
			ok: true,
			data: {
				interactionId: r.interactionId ?? parseInteractionId(r.audioUrl),
				transcript: null,
				reply: r.reply,
				audioUrl: r.audioUrl ?? null,
				timings: r.timings ?? null,
			},
		}
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Send failed",
		}
	}
}
