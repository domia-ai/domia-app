import { desc, eq } from "drizzle-orm"
import { interactionTrace } from "@domia-app/db"
import { db } from "@/db"
import { getNodeEndpoint } from "@/services/fleet"
import { nodeChat, nodeVoice, parseInteractionId } from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	ChatExchangeResult,
	ChatTurn,
	SendMessageInput,
} from "@/types/chat"

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
				domiaKey: input.targetDomiaKey,
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
		const r = await nodeChat(base, {
			text: input.text,
			speak: input.speak,
			domiaKey: input.targetDomiaKey,
		})
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

const HISTORY_LIMIT = 12

export const recentChatTurns = async (
	domiaKey: string,
): Promise<ActionResult<ChatTurn[]>> => {
	try {
		const rows = await db
			.select({
				id: interactionTrace.id,
				inputType: interactionTrace.inputType,
				responseType: interactionTrace.responseType,
				inputRaw: interactionTrace.inputRaw,
				sttResult: interactionTrace.sttResult,
				inputAudioPath: interactionTrace.inputAudioPath,
				llmResponse: interactionTrace.llmResponse,
				createdAt: interactionTrace.createdAt,
			})
			.from(interactionTrace)
			.where(eq(interactionTrace.sourceDomiaKey, domiaKey))
			.orderBy(desc(interactionTrace.createdAt))
			.limit(HISTORY_LIMIT)

		const turns: ChatTurn[] = []
		for (const r of [...rows].reverse()) {
			const isVoice = r.inputType === "VOICE"
			const at = r.createdAt ?? new Date().toISOString()
			turns.push({
				id: `${r.id}-u`,
				role: "user",
				kind: isVoice ? "voice" : "text",
				text: (isVoice ? r.sttResult : r.inputRaw) ?? "",
				transcript: isVoice ? r.sttResult : null,
				interactionId: r.id,
				audioUrl: isVoice && r.inputAudioPath ? "input" : null,
				at,
			})
			turns.push({
				id: `${r.id}-d`,
				role: "domia",
				kind: isVoice ? "voice" : "text",
				text: r.llmResponse ?? "",
				interactionId: r.id,
				audioUrl: r.responseType === "voice" ? "tts" : null,
				spoken: r.responseType === "voice",
				at,
			})
		}
		return { ok: true, data: turns }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not load history",
		}
	}
}
