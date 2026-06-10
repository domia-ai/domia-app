import { env } from "@/config"
import type {
	NodeChatBody,
	NodeChatResponse,
	NodeVoiceBody,
	NodeVoiceResponse,
} from "@/types/conversations"
import type {
	ConfigSnapshot,
	ConfigImportResult,
	ConfigHealth,
	ModelsReport,
	ModelJob,
} from "@/types/config"

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

export const nodeGetConfig = (base: string) =>
	get<{ config: ConfigSnapshot }>(base, "/config")

export const nodeImportConfig = (
	base: string,
	bundle: Record<string, unknown>,
) => post<ConfigImportResult>(base, "/config", bundle)

export const nodeGetConfigHealth = (base: string) =>
	get<{ health: ConfigHealth }>(base, "/config/health")

export const nodeRestart = (base: string) =>
	post<{ restarting: boolean }>(base, "/admin/restart", {})

export const nodeGetModels = (base: string) =>
	get<{ models: ModelsReport }>(base, "/models")

export const nodeInstallModel = (base: string, spec: Record<string, unknown>) =>
	post<{ job: ModelJob }>(base, "/models/install", spec)

export const nodeGetModelJob = (base: string, id: string) =>
	get<{ job: ModelJob }>(base, `/models/jobs/${id}`)

export const parseInteractionId = (
	audioUrl: string | null | undefined,
): string | null => {
	if (!audioUrl) return null
	const match = audioUrl.match(/\/audio\/([^/?]+)/)
	return match ? match[1] : null
}
