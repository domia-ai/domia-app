import { z } from "zod"
import { mindSchema } from "@/schemas/mind"

const MAX_SEARCH = 200
const MAX_FILTER_VALUE = 200
const MAX_CORRECTION = 5000
const MAX_TAGS = 20
const MAX_TAG_LEN = 60
const MAX_BULK_IDS = 500
const MAX_TEXT = 8000
const MAX_AUDIO_BASE64 = 20_000_000

export const idSchema = z.string().min(1).max(200)

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

export const importMindInputSchema = z.object({
	domiaKey: z.string().min(1).max(200),
	mind: mindSchema,
})

const MAX_NAME = 80
const MAX_DESCRIPTION = 280

export const createTemplateInputSchema = z.object({
	name: z.string().min(1).max(MAX_NAME),
	description: z.string().max(MAX_DESCRIPTION),
	mind: mindSchema,
})

export const updateTemplateInputSchema = createTemplateInputSchema.extend({
	id: z.string().min(1).max(200),
})

export const applyTemplateInputSchema = z.object({
	templateId: z.string().min(1).max(200),
	domiaKey: z.string().min(1).max(200),
})

export const runInteractionInputSchema = z.object({
	sourceInteractionId: z.string().min(1).max(200),
	targetDomiaKey: z.string().min(1).max(200),
	mode: z.enum(["text", "voice", "transcript-as-voice"]),
})
