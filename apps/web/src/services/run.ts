import { readFile } from "node:fs/promises"
import { getInteraction } from "@/services/conversations"
import { getNodeEndpoint } from "@/services/fleet"
import { nodeChat, nodeVoice, parseInteractionId } from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	RunInteractionInput,
	RunInteractionResult,
} from "@/types/conversations"

export const runInteraction = async (
	input: RunInteractionInput,
): Promise<ActionResult<RunInteractionResult>> => {
	try {
		const detail = await getInteraction(input.sourceInteractionId)
		if (!detail) return { ok: false, error: "Source interaction not found" }

		const endpoint = await getNodeEndpoint(input.targetDomiaKey)
		if (!endpoint)
			return { ok: false, error: "Target node has no reachable address" }
		const base = `http://${endpoint.localIp}:${endpoint.httpPort}`
		const { trace, inputAudio } = detail

		if (input.mode === "voice") {
			if (!inputAudio?.localPath)
				return {
					ok: false,
					error: "No input audio archived for voice re-run",
				}
			const audioBase64 = (await readFile(inputAudio.localPath)).toString(
				"base64",
			)
			const r = await nodeVoice(base, { audioBase64 })
			return {
				ok: true,
				data: {
					reply: r.reply,
					transcript: r.transcript,
					timings: r.timings,
					newInteractionId: r.interactionId,
					audioUrl: r.audioUrl,
					audioBase: base,
				},
			}
		}

		const text =
			input.mode === "transcript-as-voice"
				? (trace.sttResult ?? trace.inputRaw)
				: trace.inputRaw
		if (!text) return { ok: false, error: "No input text to re-run" }
		const speak =
			input.mode === "transcript-as-voice" || trace.responseType === "voice"
		const r = await nodeChat(base, { text, speak })
		return {
			ok: true,
			data: {
				reply: r.reply,
				transcript: null,
				timings: r.timings ?? null,
				newInteractionId: parseInteractionId(r.audioUrl),
				audioUrl: r.audioUrl ?? null,
				audioBase: base,
			},
		}
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Run failed",
		}
	}
}
