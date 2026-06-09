import { env } from "@/config"
import type {
	NodeChatBody,
	NodeChatResponse,
	NodeVoiceBody,
	NodeVoiceResponse,
} from "@/types/conversations"
import type { MindSnapshot, NodeMindResponse } from "@/types/mind"

const get = async <T>(base: string, path: string): Promise<T> => {
	const res = await fetch(`${base}${path}`, {
		signal: AbortSignal.timeout(env.DOMIA_NODE_TIMEOUT_MS),
	})
	if (!res.ok) {
		throw new Error(`${path} failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<T>
}

const post = async <T>(
	base: string,
	path: string,
	body: unknown,
): Promise<T> => {
	const res = await fetch(`${base}${path}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(env.DOMIA_NODE_TIMEOUT_MS),
	})
	if (!res.ok) {
		throw new Error(`${path} failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<T>
}

export const nodeChat = (base: string, body: NodeChatBody) =>
	post<NodeChatResponse>(base, "/chat", body)

export const nodeVoice = (base: string, body: NodeVoiceBody) =>
	post<NodeVoiceResponse>(base, "/voice", body)

export const nodeGetMind = (base: string) =>
	get<NodeMindResponse>(base, "/mind")

export const nodeImportMind = (base: string, mind: MindSnapshot) =>
	post<NodeMindResponse>(base, "/mind/import", { mind })

export const parseInteractionId = (
	audioUrl: string | null | undefined,
): string | null => {
	if (!audioUrl) return null
	const match = audioUrl.match(/\/audio\/([^/?]+)/)
	return match ? match[1] : null
}
