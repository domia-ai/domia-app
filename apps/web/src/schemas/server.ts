import { z } from "zod"

const MAX_SEARCH = 200
const MAX_FILTER_VALUE = 200
const MAX_CORRECTION = 5000
const MAX_TAGS = 20
const MAX_TAG_LEN = 60
const MAX_BULK_IDS = 500
const MAX_TEXT = 8000
const MAX_AUDIO_BASE64 = 20_000_000

export const idSchema = z.string().min(1).max(200)

export const nodeIdSchema = z.string().min(1).max(200)

export const createIdentityInputSchema = z.object({
	anchorDomiaKey: z.string().min(1).max(200),
	name: z.string().min(1).max(80),
})

export const removeIdentityInputSchema = z.object({
	anchorDomiaKey: z.string().min(1).max(200),
	domiaKey: z.string().min(1).max(200),
})

export const discoverSatellitesInputSchema = z.string().min(1).max(200)

export const listSatellitesInputSchema = z.string().min(1).max(200)

export const bindSatelliteInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	satelliteId: z.string().min(1).max(200),
	name: z.string().min(1).max(120).optional(),
	host: z.string().min(1).max(200),
	port: z.number().int().positive().max(65535).optional(),
	encryptionKey: z.string().min(1).max(200).optional(),
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
