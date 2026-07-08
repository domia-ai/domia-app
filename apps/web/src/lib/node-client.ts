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
import type { KnowledgeEntry, KnowledgeInput } from "@/types/knowledge"
import type {
	PresenceEntry,
	SpeakResult,
	IntercomResult,
	CancelTurnResult,
} from "@/types/rooms"
import type {
	NodeIdentity,
	CreateIdentityResult,
	RemoveIdentityResult,
} from "@/types/nodes"
import type {
	DiscoveredSatellite,
	BoundSatelliteRow,
	BindSatelliteBody,
	BindSatelliteResult,
	UnbindSatelliteResult,
	SetWakeWordsResult,
	SetNumberResult,
	SetFollowUpResult,
	SetVolumeResult,
	TestSpeakerResult,
} from "@/types/satellites"

export const meshHeaders = (): Record<string, string> => ({
	authorization: `Bearer ${env.DOMIA_MESH_SECRET}`,
})

const withKey = (path: string, domiaKey?: string): string =>
	domiaKey
		? `${path}${path.includes("?") ? "&" : "?"}domiaKey=${encodeURIComponent(domiaKey)}`
		: path

const get = async <T>(base: string, path: string): Promise<T> => {
	const res = await fetch(`${base}${path}`, {
		headers: meshHeaders(),
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
		headers: { "Content-Type": "application/json", ...meshHeaders() },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(env.DOMIA_NODE_TIMEOUT_MS),
	})
	if (!res.ok) {
		throw new Error(`${path} failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<T>
}

const del = async <T>(base: string, path: string): Promise<T> => {
	const res = await fetch(`${base}${path}`, {
		method: "DELETE",
		headers: meshHeaders(),
		signal: AbortSignal.timeout(env.DOMIA_NODE_TIMEOUT_MS),
	})
	if (!res.ok) {
		throw new Error(`${path} failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<T>
}

const patch = async <T>(
	base: string,
	path: string,
	body: unknown,
): Promise<T> => {
	const res = await fetch(`${base}${path}`, {
		method: "PATCH",
		headers: { "Content-Type": "application/json", ...meshHeaders() },
		body: JSON.stringify(body),
		signal: AbortSignal.timeout(env.DOMIA_NODE_TIMEOUT_MS),
	})
	if (!res.ok) {
		throw new Error(`${path} failed (${res.status}): ${await res.text()}`)
	}
	return res.json() as Promise<T>
}

export const nodePresence = (base: string) =>
	get<{ presence: PresenceEntry[] }>(base, "/presence")

export const nodeSpeak = (
	base: string,
	body: {
		domiaKey?: string
		broadcast?: boolean
		active?: boolean
		text: string
		broadcastId?: string
	},
) => post<SpeakResult>(base, "/speak", body)

export const nodeAnnounceAudio = (
	base: string,
	body: {
		domiaKey?: string
		audioBase64: string
		mode: "voice" | "transcribe"
		broadcastId?: string
	},
) =>
	post<{
		mode: "voice" | "transcribe"
		delivered: boolean
		target?: string
		transcript?: string
	}>(base, "/announce-audio", body)

export const nodeIntercom = (
	base: string,
	body: { from: string; to?: string; stop?: boolean },
) => post<IntercomResult>(base, "/intercom", body)

export const nodeCancelTurn = (base: string, body: { domiaKey: string }) =>
	post<CancelTurnResult>(base, "/turn/cancel", body)

export const nodeChat = (base: string, body: NodeChatBody) =>
	post<NodeChatResponse>(base, "/chat", body)

export const nodeVoice = (base: string, body: NodeVoiceBody) =>
	post<NodeVoiceResponse>(base, "/voice", body)

export const nodeGetConfig = (base: string, domiaKey?: string) =>
	get<{ config: ConfigSnapshot }>(base, withKey("/config", domiaKey))

export const nodeImportConfig = (
	base: string,
	bundle: Record<string, unknown>,
	domiaKey?: string,
) => post<ConfigImportResult>(base, withKey("/config", domiaKey), bundle)

export const nodeGetConfigHealth = (base: string, domiaKey?: string) =>
	get<{ health: ConfigHealth }>(base, withKey("/config/health", domiaKey))

export const nodeGetKnowledge = (base: string, domiaKey?: string) =>
	get<{ entries: KnowledgeEntry[] }>(base, withKey("/knowledge", domiaKey))

export const nodeUpsertKnowledge = (
	base: string,
	body: KnowledgeInput,
	domiaKey?: string,
) => post<{ ok: boolean }>(base, withKey("/knowledge", domiaKey), body)

export const nodeDeleteKnowledge = (
	base: string,
	id: string,
	domiaKey?: string,
) =>
	del<{ ok: boolean }>(
		base,
		withKey(`/knowledge/${encodeURIComponent(id)}`, domiaKey),
	)

export const nodeRestart = (base: string) =>
	post<{ restarting: boolean }>(base, "/admin/restart", {})

export const nodeGetModels = (base: string, domiaKey?: string) =>
	get<{ models: ModelsReport }>(base, withKey("/models", domiaKey))

export const nodeInstallModel = (
	base: string,
	spec: Record<string, unknown>,
	domiaKey?: string,
) => post<{ job: ModelJob }>(base, withKey("/models/install", domiaKey), spec)

export const nodeGetModelJob = (base: string, id: string, domiaKey?: string) =>
	get<{ job: ModelJob }>(base, withKey(`/models/jobs/${id}`, domiaKey))

export const nodeListIdentities = (base: string) =>
	get<{ identities: NodeIdentity[] }>(base, "/identities")

export const nodeCreateIdentity = (base: string, body: { name: string }) =>
	post<CreateIdentityResult>(base, "/identities", body)

export const nodeRemoveIdentity = (base: string, domiaKey: string) =>
	del<RemoveIdentityResult>(base, `/identities/${encodeURIComponent(domiaKey)}`)

export const nodeDiscoverSatellites = (base: string) =>
	get<{ satellites: DiscoveredSatellite[] }>(base, "/satellites/discover")

export const nodeListSatellites = (base: string, domiaKey: string) =>
	get<{ satellites: BoundSatelliteRow[] }>(
		base,
		withKey("/satellites", domiaKey),
	)

export const nodeBindSatellite = (
	base: string,
	domiaKey: string,
	body: BindSatelliteBody,
) => post<BindSatelliteResult>(base, withKey("/satellites", domiaKey), body)

export const nodeUnbindSatellite = (
	base: string,
	domiaKey: string,
	satelliteId: string,
) =>
	del<UnbindSatelliteResult>(
		base,
		withKey(`/satellites/${encodeURIComponent(satelliteId)}`, domiaKey),
	)

export const nodeSetSatelliteWakeWords = (
	base: string,
	domiaKey: string,
	satelliteId: string,
	wakeWords: string[],
) =>
	patch<SetWakeWordsResult>(
		base,
		withKey(
			`/satellites/${encodeURIComponent(satelliteId)}/wake-words`,
			domiaKey,
		),
		{ wakeWords },
	)

export const nodeSetSatelliteNumber = (
	base: string,
	domiaKey: string,
	satelliteId: string,
	entityId: string,
	value: number,
) =>
	patch<SetNumberResult>(
		base,
		withKey(`/satellites/${encodeURIComponent(satelliteId)}/numbers`, domiaKey),
		{ entityId, value },
	)

export const nodeSetSatelliteFollowUp = (
	base: string,
	domiaKey: string,
	satelliteId: string,
	enabled: boolean,
) =>
	patch<SetFollowUpResult>(
		base,
		withKey(
			`/satellites/${encodeURIComponent(satelliteId)}/follow-up`,
			domiaKey,
		),
		{ enabled },
	)

export const nodeSetSatelliteVolume = (
	base: string,
	domiaKey: string,
	satelliteId: string,
	volume: number,
) =>
	patch<SetVolumeResult>(
		base,
		withKey(`/satellites/${encodeURIComponent(satelliteId)}/volume`, domiaKey),
		{ volume },
	)

export const nodeTestSatelliteSpeaker = (
	base: string,
	domiaKey: string,
	satelliteId: string,
) =>
	post<TestSpeakerResult>(
		base,
		withKey(
			`/satellites/${encodeURIComponent(satelliteId)}/test-speaker`,
			domiaKey,
		),
		{},
	)

export const parseInteractionId = (
	audioUrl: string | null | undefined,
): string | null => {
	if (!audioUrl) return null
	const match = audioUrl.match(/\/audio\/([^/?]+)/)
	return match ? match[1] : null
}
