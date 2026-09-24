import { env } from "@/config"
import { createNodeRequestError } from "@/utils/service-errors"
import type {
	NodeChatBody,
	NodeChatResponse,
	NodeInteractionResult,
	NodeVoiceBody,
	NodeVoiceResponse,
} from "@/types/conversations"
import type {
	ConfigImportResult,
	ConfigResult,
	ConfigHealthResult,
	ConfigSchema,
	ModelsResult,
	ModelJobResult,
} from "@/types/config"
import type {
	KnowledgeInput,
	KnowledgeListResult,
	KnowledgeMutationResult,
} from "@/types/knowledge"
import type {
	SpeakResult,
	IntercomResult,
	CancelTurnResult,
	PresenceListResult,
	SpeakBody,
	AnnounceAudioBody,
	AnnounceAudioResult,
	IntercomBody,
	CancelTurnBody,
} from "@/types/rooms"
import type {
	CreateIdentityResult,
	RemoveIdentityResult,
	CreateIdentityBody,
	IdentitiesResult,
	NodeConfigApplyResult,
	NodeConfigSection,
	NodeConfigSnapshot,
	NodeHealth,
	RestartResult,
} from "@/types/nodes"
import type {
	BindSatelliteBody,
	BindSatelliteResult,
	UnbindSatelliteResult,
	SetWakeWordsResult,
	SetNumberResult,
	SetFollowUpResult,
	SetVolumeResult,
	TestSpeakerResult,
	LivekitTokenGrant,
	DiscoverSatellitesResult,
	ListSatellitesResult,
	SatelliteSettingsInput,
	SetSatelliteSettingsResult,
} from "@/types/satellites"
import { skillsStatusPayloadSchema } from "@/schemas/skills"
import { proactivityStatusSchema } from "@/schemas/proactivity"
import { toolRunsResultSchema } from "@/schemas/tool-runs"
import {
	confirmationsResultSchema,
	settleConfirmationResultSchema,
} from "@/schemas/confirmations"
import type { ToolRunsResult } from "@/types/tool-runs"
import type {
	ConfirmationDecision,
	ConfirmationsResult,
	SettleConfirmationResult,
} from "@/types/confirmations"
import { nodeLatencyStatsResultSchema } from "@/schemas/latency"
import type {
	SkillsStatusPayload,
	DiscoverSkillProvidersResult,
	SkillDescriptorSchemaResult,
} from "@/types/skills"
import type { NodeLatencyStats } from "@/types/latency"
import type {
	CancelScheduleResult,
	CancelSatelliteTimerResult,
	CreateScheduleInput,
	CreateScheduleResult,
	ProactiveScheduleStatus,
	ProactivityStatus,
	SatelliteTimersResult,
	ScheduleListResult,
	StartSatelliteTimerBody,
	StartSatelliteTimerResult,
} from "@/types/proactivity"
import type {
	DeleteRoutineResult,
	FastPathTryResult,
	RoutineInput,
	RoutinesResult,
	SaveRoutineResult,
} from "@/types/routines"
import type {
	DeleteIdentityDataResult,
	MeshRotateAction,
	MeshRotateResult,
	ResetConversationResult,
} from "@/types/mesh-admin"
import {
	mindExportResultSchema,
	mindImportResultSchema,
} from "@/schemas/mind-transfer"
import type {
	MindBundle,
	MindImportBody,
	MindImportReport,
	MindSection,
} from "@/types/mind-transfer"
import type { BenchRunBody, BenchRunResult } from "@/types/bench"
import type { LiveVoiceTokenInput, SatelliteTokenGrant } from "@/types/live"
import type {
	VoiceFeelMutationResult,
	VoiceFeelSnapshot,
} from "@/types/voice-feel"

export const meshHeaders = (): Record<string, string> => ({
	authorization: `Bearer ${env.DOMIA_MESH_SECRET}`,
})

const requestError = async (res: Response, path: string) =>
	createNodeRequestError({
		status: res.status,
		path,
		text: await res.text(),
	})

const withKey = (path: string, domiaKey?: string): string =>
	domiaKey
		? `${path}${path.includes("?") ? "&" : "?"}domiaKey=${encodeURIComponent(domiaKey)}`
		: path

const get = async <T>(
	base: string,
	path: string,
	timeoutMs: number = env.DOMIA_NODE_TIMEOUT_MS,
): Promise<T> => {
	const res = await fetch(`${base}${path}`, {
		headers: meshHeaders(),
		signal: AbortSignal.timeout(timeoutMs),
	})
	if (!res.ok) throw await requestError(res, path)
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
	if (!res.ok) throw await requestError(res, path)
	return res.json() as Promise<T>
}

const del = async <T>(base: string, path: string): Promise<T> => {
	const res = await fetch(`${base}${path}`, {
		method: "DELETE",
		headers: meshHeaders(),
		signal: AbortSignal.timeout(env.DOMIA_NODE_TIMEOUT_MS),
	})
	if (!res.ok) throw await requestError(res, path)
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
	if (!res.ok) throw await requestError(res, path)
	return res.json() as Promise<T>
}

export const nodePresence = (base: string) =>
	get<PresenceListResult>(base, "/presence")

export const nodeSpeak = (base: string, body: SpeakBody) =>
	post<SpeakResult>(base, "/speak", body)

export const nodeAnnounceAudio = (base: string, body: AnnounceAudioBody) =>
	post<AnnounceAudioResult>(base, "/announce-audio", body)

export const nodeIntercom = (base: string, body: IntercomBody) =>
	post<IntercomResult>(base, "/intercom", body)

export const nodeCancelTurn = (base: string, body: CancelTurnBody) =>
	post<CancelTurnResult>(base, "/turn/cancel", body)

export const nodeChat = (base: string, body: NodeChatBody) =>
	post<NodeChatResponse>(base, "/chat", body)

export const nodeVoice = (base: string, body: NodeVoiceBody) =>
	post<NodeVoiceResponse>(base, "/voice", body)

export const nodeGetConfig = (
	base: string,
	domiaKey?: string,
	timeoutMs?: number,
) => get<ConfigResult>(base, withKey("/config", domiaKey), timeoutMs)

export const nodeImportConfig = (
	base: string,
	bundle: Record<string, unknown>,
	domiaKey?: string,
) => post<ConfigImportResult>(base, withKey("/config", domiaKey), bundle)

export const nodeGetConfigHealth = (
	base: string,
	domiaKey?: string,
	timeoutMs?: number,
) =>
	get<ConfigHealthResult>(base, withKey("/config/health", domiaKey), timeoutMs)

export const nodeGetKnowledge = (base: string, domiaKey?: string) =>
	get<KnowledgeListResult>(base, withKey("/knowledge", domiaKey))

export const nodeUpsertKnowledge = (
	base: string,
	body: KnowledgeInput,
	domiaKey?: string,
) => post<KnowledgeMutationResult>(base, withKey("/knowledge", domiaKey), body)

export const nodeDeleteKnowledge = (
	base: string,
	id: string,
	domiaKey?: string,
) =>
	del<KnowledgeMutationResult>(
		base,
		withKey(`/knowledge/${encodeURIComponent(id)}`, domiaKey),
	)

export const nodeRestart = (base: string) =>
	post<RestartResult>(base, "/admin/restart", {})

export const nodeGetModels = (base: string, domiaKey?: string) =>
	get<ModelsResult>(base, withKey("/models", domiaKey))

export const nodeInstallModel = (
	base: string,
	spec: Record<string, unknown>,
	domiaKey?: string,
) => post<ModelJobResult>(base, withKey("/models/install", domiaKey), spec)

export const nodeGetModelJob = (base: string, id: string) =>
	get<ModelJobResult>(base, `/models/jobs/${encodeURIComponent(id)}`)

export const nodeListIdentities = (base: string, timeoutMs?: number) =>
	get<IdentitiesResult>(base, "/identities", timeoutMs)

export const nodeCreateIdentity = (base: string, body: CreateIdentityBody) =>
	post<CreateIdentityResult>(base, "/identities", body)

export const nodeRemoveIdentity = (base: string, domiaKey: string) =>
	del<RemoveIdentityResult>(base, `/identities/${encodeURIComponent(domiaKey)}`)

export const nodeGetSkills = async (
	base: string,
	domiaKey: string,
	timeoutMs?: number,
): Promise<SkillsStatusPayload> =>
	skillsStatusPayloadSchema.parse(
		await get<unknown>(base, withKey("/skills", domiaKey), timeoutMs),
	)

export const nodeDiscoverSkillProviders = (base: string) =>
	get<DiscoverSkillProvidersResult>(base, "/skills/discover")

export const nodeDiscoverSatellites = (base: string) =>
	get<DiscoverSatellitesResult>(base, "/satellites/discover")

export const nodeListSatellites = (
	base: string,
	domiaKey: string,
	timeoutMs?: number,
) =>
	get<ListSatellitesResult>(base, withKey("/satellites", domiaKey), timeoutMs)

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

export const nodeGetLivekitToken = (
	base: string,
	domiaKey: string,
	satelliteId: string,
) =>
	get<LivekitTokenGrant>(
		base,
		withKey(
			`/satellites/${encodeURIComponent(satelliteId)}/livekit-token`,
			domiaKey,
		),
	)

export const nodeMintSatelliteToken = (
	base: string,
	body: LiveVoiceTokenInput,
) => post<SatelliteTokenGrant>(base, "/satellite/token", body)

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

export const nodeRunBench = (
	base: string,
	domiaKey: string,
	body: BenchRunBody,
) => post<BenchRunResult>(base, withKey("/bench/run", domiaKey), body)

export const nodeGetVoiceFeel = (base: string, domiaKey: string) =>
	get<VoiceFeelSnapshot>(base, withKey("/voice-feel", domiaKey))

export const nodeApplyVoiceFeel = (
	base: string,
	domiaKey: string,
	id: string,
) =>
	post<VoiceFeelMutationResult>(
		base,
		withKey(`/voice-feel/apply/${encodeURIComponent(id)}`, domiaKey),
		{},
	)

export const nodeRevertVoiceFeel = (
	base: string,
	domiaKey: string,
	id: string,
) =>
	post<VoiceFeelMutationResult>(
		base,
		withKey(`/voice-feel/revert/${encodeURIComponent(id)}`, domiaKey),
		{},
	)

export const nodeGetConfigSchema = (base: string, timeoutMs?: number) =>
	get<ConfigSchema>(base, "/config/schema", timeoutMs)

export const nodeGetNodeConfig = (base: string, timeoutMs?: number) =>
	get<NodeConfigSnapshot>(base, "/node/config", timeoutMs)

export const nodeUpdateNodeConfig = (
	base: string,
	node: Partial<NodeConfigSection>,
) => post<NodeConfigApplyResult>(base, "/node/config", { version: 1, node })

const getProbe = async <T>(
	base: string,
	path: string,
	timeoutMs: number,
	headers: Record<string, string>,
): Promise<T> => {
	const res = await fetch(`${base}${path}`, {
		headers,
		signal: AbortSignal.timeout(timeoutMs),
	})
	if (res.status === 401) throw new Error("Node rejected the mesh secret")
	if (!res.ok) throw await requestError(res, path)
	return res.json() as Promise<T>
}

export const nodeGetInteraction = (
	base: string,
	domiaKey: string,
	interactionId: string,
) =>
	get<NodeInteractionResult>(
		base,
		withKey(`/interactions/${encodeURIComponent(interactionId)}`, domiaKey),
	)

export const nodeGetLatencyStats = async (
	base: string,
	domiaKey: string,
	timeoutMs?: number,
): Promise<NodeLatencyStats> =>
	nodeLatencyStatsResultSchema.parse(
		await get<unknown>(base, withKey("/stats/latency", domiaKey), timeoutMs),
	).stats

export const nodeGetDescriptorSchema = (base: string, timeoutMs?: number) =>
	get<SkillDescriptorSchemaResult>(base, "/skills/descriptor-schema", timeoutMs)

export const nodeGetRoutines = (base: string, domiaKey: string) =>
	get<RoutinesResult>(base, withKey("/routines", domiaKey))

export const nodeSaveRoutine = (
	base: string,
	domiaKey: string,
	body: RoutineInput,
) => post<SaveRoutineResult>(base, withKey("/routines", domiaKey), body)

export const nodeDeleteRoutine = (base: string, domiaKey: string, id: string) =>
	del<DeleteRoutineResult>(
		base,
		withKey(`/routines/${encodeURIComponent(id)}`, domiaKey),
	)

export const nodeTryFastPath = (base: string, domiaKey: string, text: string) =>
	post<FastPathTryResult>(base, withKey("/skills/fast-path/try", domiaKey), {
		text,
	})

export const nodeGetProactivityStatus = async (
	base: string,
	domiaKey: string,
	timeoutMs?: number,
): Promise<ProactivityStatus> =>
	proactivityStatusSchema.parse(
		await get<unknown>(
			base,
			withKey("/proactivity/status", domiaKey),
			timeoutMs,
		),
	)

export const nodeGetProactivitySchedule = (
	base: string,
	domiaKey: string,
	statuses?: readonly ProactiveScheduleStatus[],
) =>
	get<ScheduleListResult>(
		base,
		withKey(
			statuses?.length
				? `/proactivity/schedule?status=${encodeURIComponent(statuses.join(","))}`
				: "/proactivity/schedule",
			domiaKey,
		),
	)

export const nodeCreateProactivityItem = (
	base: string,
	domiaKey: string,
	body: CreateScheduleInput,
) =>
	post<CreateScheduleResult>(
		base,
		withKey("/proactivity/schedule", domiaKey),
		body,
	)

export const nodeCancelProactivityItem = (
	base: string,
	domiaKey: string,
	id: string,
) =>
	del<CancelScheduleResult>(
		base,
		withKey(`/proactivity/schedule/${encodeURIComponent(id)}`, domiaKey),
	)

export const nodeListSatelliteTimers = (
	base: string,
	domiaKey: string,
	satelliteId: string,
) =>
	get<SatelliteTimersResult>(
		base,
		withKey(`/satellites/${encodeURIComponent(satelliteId)}/timers`, domiaKey),
	)

export const nodeStartSatelliteTimer = (
	base: string,
	domiaKey: string,
	satelliteId: string,
	body: StartSatelliteTimerBody,
) =>
	post<StartSatelliteTimerResult>(
		base,
		withKey(`/satellites/${encodeURIComponent(satelliteId)}/timers`, domiaKey),
		body,
	)

export const nodeCancelSatelliteTimer = (
	base: string,
	domiaKey: string,
	satelliteId: string,
	timerId: string,
) =>
	del<CancelSatelliteTimerResult>(
		base,
		withKey(
			`/satellites/${encodeURIComponent(satelliteId)}/timers/${encodeURIComponent(timerId)}`,
			domiaKey,
		),
	)

export const nodeSetSatelliteSettings = (
	base: string,
	domiaKey: string,
	satelliteId: string,
	body: SatelliteSettingsInput,
) =>
	patch<SetSatelliteSettingsResult>(
		base,
		withKey(
			`/satellites/${encodeURIComponent(satelliteId)}/settings`,
			domiaKey,
		),
		body,
	)

export const nodeRotateMesh = (base: string, action: MeshRotateAction) =>
	post<MeshRotateResult>(base, "/mesh/rotate", { action })

export const nodeDeleteIdentityData = (base: string, domiaKey: string) =>
	del<DeleteIdentityDataResult>(base, withKey("/identity-data", domiaKey))

export const nodeResetConversation = (base: string, domiaKey: string) =>
	post<ResetConversationResult>(
		base,
		withKey("/admin/reset-conversation", domiaKey),
		{},
	)

export const nodeProbeHealth = (base: string, timeoutMs: number) =>
	getProbe<NodeHealth>(base, "/health", timeoutMs, {})

export const nodeProbeIdentities = (base: string, timeoutMs: number) =>
	getProbe<IdentitiesResult>(base, "/identities", timeoutMs, meshHeaders())

export const nodeGetToolRuns = async (
	base: string,
	domiaKey: string,
	interactionId: string,
	timeoutMs?: number,
): Promise<ToolRunsResult> =>
	toolRunsResultSchema.parse(
		await get<unknown>(
			base,
			withKey(
				`/tool-runs?interactionId=${encodeURIComponent(interactionId)}`,
				domiaKey,
			),
			timeoutMs,
		),
	) as ToolRunsResult

export const nodeGetConfirmations = async (
	base: string,
	domiaKey: string,
	timeoutMs?: number,
): Promise<ConfirmationsResult> =>
	confirmationsResultSchema.parse(
		await get<unknown>(base, withKey("/confirmations", domiaKey), timeoutMs),
	) as ConfirmationsResult

export const nodeSettleConfirmation = async (
	base: string,
	domiaKey: string,
	scope: string,
	decision: ConfirmationDecision,
): Promise<SettleConfirmationResult> =>
	settleConfirmationResultSchema.parse(
		await post<unknown>(
			base,
			withKey(`/confirmations/${encodeURIComponent(scope)}/settle`, domiaKey),
			{ decision },
		),
	) as SettleConfirmationResult

export const nodeExportMind = async (
	base: string,
	domiaKey: string,
	sections?: MindSection[],
): Promise<MindBundle> =>
	mindExportResultSchema.parse(
		await get<unknown>(
			base,
			withKey(
				sections?.length
					? `/mind/export?sections=${encodeURIComponent(sections.join(","))}`
					: "/mind/export",
				domiaKey,
			),
		),
	).bundle

export const nodeImportMind = async (
	base: string,
	domiaKey: string,
	body: MindImportBody,
): Promise<MindImportReport> =>
	mindImportResultSchema.parse(
		await post<unknown>(base, withKey("/mind/import", domiaKey), body),
	).report
