import { z } from "zod"
import {
	ROUTINE_MAX_DESCRIPTION_CHARS,
	ROUTINE_MAX_NAME_CHARS,
	ROUTINE_MAX_PHRASE_CHARS,
	ROUTINE_MAX_PHRASES_PER_LOCALE,
	ROUTINE_MAX_REPLY_CHARS,
	ROUTINE_MAX_SLOT_VALUES,
	ROUTINE_MAX_STEPS,
	ROUTINE_MAX_TOOL_CHARS,
	ROUTINE_SLUG_PATTERN,
	ROUTINE_TRY_MAX_CHARS,
} from "@/constants/routines"
import {
	REMINDER_MAX_MINUTES,
	REMINDER_MAX_NAME_CHARS,
	REMINDER_MIN_MINUTES,
	TIMER_MAX_SECONDS,
	TIMER_MIN_SECONDS,
} from "@/constants/proactivity"
import type { JsonValue } from "@/types/config"

const MAX_SEARCH = 200
const MAX_FILTER_VALUE = 200
const MAX_CORRECTION = 5000
const MAX_TAGS = 20
const MAX_TAG_LEN = 60
const MAX_BULK_IDS = 500
const MAX_TEXT = 8000
const MAX_AUDIO_BASE64 = 20_000_000

export const idSchema = z.string().min(1).max(200)

export const configSchemaInputSchema = z.string().max(200)

export const nodeIdSchema = z.string().min(1).max(200)

export const createIdentityInputSchema = z.object({
	anchorDomiaKey: z.string().min(1).max(200),
	name: z.string().min(1).max(80),
	domiaKey: z.string().trim().min(1).max(200).optional(),
})

export const removeIdentityInputSchema = z.object({
	anchorDomiaKey: z.string().min(1).max(200),
	domiaKey: z.string().min(1).max(200),
})

export const discoverSatellitesInputSchema = z.string().min(1).max(200)
export const skillsStatusInputSchema = z.string().min(1).max(200)
export const discoverSkillProvidersInputSchema = z.string().min(1).max(200)

export const listSatellitesInputSchema = z.string().min(1).max(200)

export const livekitTokenInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
})

export const bindSatelliteInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	name: z.string().min(1).max(120).optional(),
	host: z.string().min(1).max(200),
	port: z.number().int().positive().max(65535).optional(),
	encryptionKey: z.string().min(1).max(200).optional(),
	protocol: z.string().min(1).max(40).optional(),
	livekitRoom: z.string().min(1).max(200).optional(),
	livekitApiKey: z.string().min(1).max(200).optional(),
	livekitApiSecret: z.string().min(1).max(200).optional(),
})

export const unbindSatelliteInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
})

export const setSatelliteWakeWordsInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	wakeWords: z.array(z.string().min(1).max(120)).min(1).max(8),
})

export const setSatelliteNumberInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	entityId: z.string().min(1).max(200),
	value: z.number(),
})

export const setSatelliteFollowUpInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	enabled: z.boolean(),
})

export const setSatelliteVolumeInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	volume: z.number().min(0).max(1),
})

export const setSatelliteSettingsInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	settings: z
		.object({
			followUpNoSpeechMs: z.number().int().min(0).optional(),
			followUpRequestMaxMs: z.number().int().min(0).optional(),
			playbackDrainMarginMs: z.number().int().min(0).optional(),
			runListeningMaxMs: z.number().int().min(0).optional(),
			captureHeadTrimMs: z.number().int().min(0).optional(),
			wyomingStreamingTts: z.boolean().optional(),
			mediaPlayerName: z.string().trim().min(1).max(200).nullable().optional(),
		})
		.refine((settings) => Object.keys(settings).length > 0),
})

export const testSatelliteSpeakerInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
})

export const tableParamsSchema = z.object({
	page: z.number().int().min(0),
	pageSize: z.number().int().min(1).max(200),
	search: z.string().max(MAX_SEARCH),
	sort: z
		.object({ field: z.string().max(64), dir: z.enum(["asc", "desc"]) })
		.nullable(),
	filters: z.record(z.string().max(64), z.string().max(MAX_FILTER_VALUE)),
})

export const gradeInputSchema = z.object({
	interactionId: z.string().min(1).max(200),
	rating: z.enum(["up", "down"]).nullable(),
	correction: z.string().max(MAX_CORRECTION).nullable(),
	tags: z.array(z.string().max(MAX_TAG_LEN)).max(MAX_TAGS).nullable(),
})

export const bulkGradeInputSchema = z.object({
	ids: z.array(z.string().min(1).max(200)).max(MAX_BULK_IDS),
	rating: z.enum(["up", "down"]),
})

export const sendMessageInputSchema = z.object({
	targetDomiaKey: z.string().min(1).max(200),
	kind: z.enum(["text", "voice"]),
	text: z.string().max(MAX_TEXT).optional(),
	audioBase64: z.string().max(MAX_AUDIO_BASE64).optional(),
	speak: z.boolean(),
	satelliteId: z.string().min(1).max(200).optional(),
})

const MAX_NAME = 80
const MAX_DESCRIPTION = 280

export const createConfigTemplateInputSchema = z.object({
	name: z.string().min(1).max(MAX_NAME),
	description: z.string().max(MAX_DESCRIPTION),
	config: z.record(z.string().max(64), z.any()),
})

export const updateConfigTemplateInputSchema =
	createConfigTemplateInputSchema.extend({
		id: z.string().min(1).max(200),
	})

export const applyTemplateInputSchema = z.object({
	templateId: z.string().min(1).max(200),
	domiaKey: z.string().min(1).max(200),
})

export const importConfigInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	bundle: z.record(z.string().max(64), z.unknown()),
})

export const installModelInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	spec: z.record(z.string().max(64), z.unknown()),
})

export const modelJobInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	jobId: z.string().min(1).max(200),
})

export const runInteractionInputSchema = z.object({
	sourceInteractionId: z.string().min(1).max(200),
	targetDomiaKey: z.string().min(1).max(200),
	mode: z.enum(["text", "voice", "transcript-as-voice"]),
	satelliteId: z.string().min(1).max(200).optional(),
})

export const setAvatarInputSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("preset"),
		domiaKey: z.string().min(1).max(200),
		presetId: z.string().min(1).max(64),
	}),
	z.object({
		kind: z.literal("custom"),
		domiaKey: z.string().min(1).max(200),
		dataBase64: z.string().min(1),
		mime: z.string().min(1).max(64),
	}),
	z.object({
		kind: z.literal("clear"),
		domiaKey: z.string().min(1).max(200),
	}),
])

export const benchRunInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	turns: z.number().int().min(1).max(50).optional(),
})

const IPV4_RE =
	/^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/
const IPV6_RE = /^\[?[0-9a-fA-F:]+(%[0-9a-zA-Z]+)?\]?$/
const HOSTNAME_RE =
	/^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.?$/

const isNodeHost = (host: string): boolean =>
	IPV4_RE.test(host) ||
	(host.includes(":") && IPV6_RE.test(host)) ||
	HOSTNAME_RE.test(host)

const isHttpBaseUrl = (value: string): boolean => {
	try {
		return /^https?:$/.test(new URL(value).protocol)
	} catch {
		return false
	}
}

export const nodeConfigUpdateInputSchema = z.object({
	anchorDomiaKey: z.string().min(1).max(200),
	node: z
		.object({
			meshControlToleranceMs: z.number().int().min(1_000).max(600_000),
			meshDropWarnWindowMs: z.number().int().min(0).max(3_600_000),
			modelDownloadTimeoutMs: z.number().int().min(1_000).max(21_600_000),
			modelInstallMaxBytes: z.number().int().min(1).max(274_877_906_944),
			modelInstallMaxRedirects: z.number().int().min(0).max(20),
			modelInstallMaxConcurrentJobs: z.number().int().min(1).max(8),
			modelJobRetentionMs: z.number().int().min(0).max(604_800_000),
			publicAudioBaseUrl: z
				.string()
				.max(512)
				.refine(isHttpBaseUrl, "must be an http(s) base URL")
				.nullable(),
		})
		.partial(),
})

export const probeNodeInputSchema = z.object({
	host: z.string().trim().min(1).max(253).refine(isNodeHost),
	port: z.number().int().positive().max(65535),
	scheme: z.enum(["http", "https"]).default("http"),
})

export const setupNameInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	name: z.string().trim().min(1).max(80),
})

export const pairHomeAssistantInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	url: z.string().trim().min(1).max(500),
	token: z.string().trim().min(1).max(2000),
	name: z.string().trim().min(1).max(120).optional(),
})

export const voiceFeelActionInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	id: z.string().min(1).max(200),
})

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
	z.union([
		z.string(),
		z.number(),
		z.boolean(),
		z.null(),
		z.array(jsonValueSchema),
		z.record(z.string(), jsonValueSchema),
	]),
)

const routineSlotSourceSchema = z.discriminatedUnion("kind", [
	z.object({ kind: z.literal("context"), key: z.string().min(1).max(120) }),
	z.object({
		kind: z.literal("enum"),
		values: z
			.array(z.string().min(1).max(200))
			.min(1)
			.max(ROUTINE_MAX_SLOT_VALUES),
	}),
	z.object({
		kind: z.literal("map"),
		values: z
			.array(
				z.object({
					in: z.array(z.string().min(1).max(200)).min(1),
					out: jsonValueSchema,
				}),
			)
			.min(1)
			.max(ROUTINE_MAX_SLOT_VALUES),
	}),
	z.object({ kind: z.literal("schemaEnum"), arg: z.string().min(1).max(120) }),
	z.object({ kind: z.literal("range"), min: z.number(), max: z.number() }),
	z.object({
		kind: z.literal("duration"),
		maxSeconds: z.number().positive().optional(),
	}),
	z.object({ kind: z.literal("clockTime") }),
])

const routineSlotSchema = z.object({
	source: routineSlotSourceSchema,
	arg: z.string().max(120).optional(),
})

export const routineInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	routine: z.object({
		id: z.string().trim().min(1).max(64).optional(),
		slug: z.string().regex(ROUTINE_SLUG_PATTERN),
		name: z.string().trim().min(1).max(ROUTINE_MAX_NAME_CHARS),
		description: z.string().trim().min(1).max(ROUTINE_MAX_DESCRIPTION_CHARS),
		isActive: z.boolean().optional(),
		phrases: z.record(
			z.string().min(2).max(8),
			z
				.array(z.string().trim().min(1).max(ROUTINE_MAX_PHRASE_CHARS))
				.min(1)
				.max(ROUTINE_MAX_PHRASES_PER_LOCALE),
		),
		slots: z.record(z.string().regex(/^\w+$/), routineSlotSchema).nullish(),
		steps: z
			.array(
				z.object({
					tool: z.string().trim().min(1).max(ROUTINE_MAX_TOOL_CHARS),
					args: z.record(z.string(), jsonValueSchema),
				}),
			)
			.min(1)
			.max(ROUTINE_MAX_STEPS),
		reply: z.record(
			z.string().min(2).max(8),
			z.string().trim().min(1).max(ROUTINE_MAX_REPLY_CHARS),
		),
	}),
})

export const deleteRoutineInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	id: z.string().min(1).max(200),
})

export const tryFastPathInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	text: z.string().trim().min(1).max(ROUTINE_TRY_MAX_CHARS),
})

export const satelliteTimersInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
})

export const createReminderInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	name: z.string().trim().min(1).max(REMINDER_MAX_NAME_CHARS),
	inMs: z
		.number()
		.int()
		.min(REMINDER_MIN_MINUTES * 60_000)
		.max(REMINDER_MAX_MINUTES * 60_000),
})

export const cancelAgendaItemInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	id: z.string().min(1).max(200),
	templateKey: z.string().max(80).nullable(),
	targetSatelliteId: z.string().max(200).nullable(),
})

export const startSatelliteTimerInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	name: z.string().trim().min(1).max(120),
	seconds: z.number().int().min(TIMER_MIN_SECONDS).max(TIMER_MAX_SECONDS),
})

export const cancelSatelliteTimerInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	timerId: z.string().min(1).max(200),
})

export const liveVoiceTokenInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
})

export const meshRotateInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	action: z.enum(["status", "restart-grace", "end-grace"]),
})

export const identityDataInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	confirmName: z.string().min(1).max(200),
})

export const settleConfirmationInputSchema = z.object({
	domiaKey: idSchema,
	scope: idSchema,
	decision: z.enum(["yes", "no"]),
})

export const interactionLadderInputSchema = z.object({
	domiaKey: idSchema,
	interactionId: idSchema,
})

export const toolRunsInputSchema = z.object({
	domiaKey: idSchema,
	interactionId: idSchema,
})
