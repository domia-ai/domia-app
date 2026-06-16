import { eq, isNotNull } from "drizzle-orm"
import { mindTemplate } from "@domia-app/db"
import { db } from "@/db"
import { importConfig } from "@/services/config"
import { SYSTEM_TEMPLATES } from "@/constants/template-seeds"
import type { ActionResult } from "@/types"
import type {
	AppTemplate,
	ApplyTemplateInput,
	CreateConfigTemplateInput,
} from "@/types/mind"
import type {
	ConfigImportResult,
	ConfigSnapshot,
	JsonObject,
	JsonValue,
} from "@/types/config"

const CONFIG_BUNDLE_VERSION = 1

const META_KEYS = [
	"id",
	"domiaId",
	"createdAt",
	"updatedAt",
	"type",
	"domiaKey",
	"localIp",
	"grpcPort",
	"isActive",
]

const stripMeta = (
	obj: Record<string, unknown> | null,
	extra: string[] = [],
): JsonObject => {
	const out: JsonObject = {}
	if (!obj) return out
	for (const [k, v] of Object.entries(obj))
		if (!META_KEYS.includes(k) && !extra.includes(k)) out[k] = v as JsonValue
	return out
}

const sanitizeConfigBundle = (c: ConfigSnapshot): JsonObject => {
	const b: JsonObject = { version: CONFIG_BUNDLE_VERSION }
	if (c.domia) b.domia = stripMeta(c.domia, ["name"])
	if (c.character) b.character = stripMeta(c.character)
	if (c.emotion) b.emotion = c.emotion
	if (c.modules) b.modules = stripMeta(c.modules)
	if (c.capabilities) b.capabilities = stripMeta(c.capabilities)
	if (c.stt) b.stt = stripMeta(c.stt)
	if (c.tts) b.tts = stripMeta(c.tts)
	if (c.llm) b.llm = stripMeta(c.llm)
	if (c.wakeWord) b.wakeWord = stripMeta(c.wakeWord)
	if (c.playback) b.playback = stripMeta(c.playback)
	if (c.skillProviders?.length)
		b.skillProviders = c.skillProviders.map((s) => {
			const base = stripMeta(s as Record<string, unknown>, ["auth"])
			const auth = (s as { auth?: { kind?: string } | null }).auth
			if (auth?.kind) base.auth = { kind: auth.kind } as JsonValue
			return base
		})
	return b
}

const SYSTEM_PREFIX = "system:"

const toAppTemplate = (row: typeof mindTemplate.$inferSelect): AppTemplate => ({
	id: row.id,
	name: row.name,
	description: row.description,
	config: row.config as ConfigSnapshot,
	isSystem: row.id.startsWith(SYSTEM_PREFIX),
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
})

const systemTemplates = (): AppTemplate[] =>
	SYSTEM_TEMPLATES.map((t) => ({
		id: t.id,
		name: t.name,
		description: t.description,
		config: t.config,
		isSystem: true,
		createdAt: 0,
		updatedAt: 0,
	}))

export const listTemplates = (): AppTemplate[] => {
	const user = db
		.select()
		.from(mindTemplate)
		.where(isNotNull(mindTemplate.config))
		.orderBy(mindTemplate.name)
		.all()
		.filter((row) => !row.id.startsWith(SYSTEM_PREFIX))
		.map(toAppTemplate)
	return [...systemTemplates(), ...user]
}

export const getTemplate = (id: string): AppTemplate | null => {
	if (id.startsWith(SYSTEM_PREFIX))
		return systemTemplates().find((t) => t.id === id) ?? null
	const [row] = db
		.select()
		.from(mindTemplate)
		.where(eq(mindTemplate.id, id))
		.limit(1)
		.all()
	return row && row.config ? toAppTemplate(row) : null
}

export const deleteTemplate = (id: string): ActionResult => {
	if (id.startsWith(SYSTEM_PREFIX))
		return { ok: false, error: "System templates can't be deleted" }
	db.delete(mindTemplate).where(eq(mindTemplate.id, id)).run()
	return { ok: true }
}

export const createConfigTemplate = (
	input: CreateConfigTemplateInput,
): ActionResult<AppTemplate> => {
	const now = Date.now()
	const id = crypto.randomUUID()
	try {
		db.insert(mindTemplate)
			.values({
				id,
				name: input.name.trim(),
				description: input.description.trim(),
				config: sanitizeConfigBundle(input.config),
				createdAt: now,
				updatedAt: now,
			})
			.run()
		return { ok: true, data: getTemplate(id)! }
	} catch (err) {
		return { ok: false, error: errorMessage(err, "name already in use") }
	}
}

export const updateConfigTemplate = (
	input: CreateConfigTemplateInput & { id: string },
): ActionResult<AppTemplate> => {
	if (input.id.startsWith(SYSTEM_PREFIX))
		return {
			ok: false,
			error: "System templates are read-only — clone instead",
		}
	try {
		db.update(mindTemplate)
			.set({
				name: input.name.trim(),
				description: input.description.trim(),
				config: sanitizeConfigBundle(input.config),
				updatedAt: Date.now(),
			})
			.where(eq(mindTemplate.id, input.id))
			.run()
		const updated = getTemplate(input.id)
		if (!updated) return { ok: false, error: "Template not found" }
		return { ok: true, data: updated }
	} catch (err) {
		return { ok: false, error: errorMessage(err, "name already in use") }
	}
}

export const applyConfigTemplate = async (
	input: ApplyTemplateInput,
): Promise<ActionResult<ConfigImportResult>> => {
	const template = getTemplate(input.templateId)
	if (!template) return { ok: false, error: "Template not found" }
	return importConfig({
		domiaKey: input.domiaKey,
		bundle: template.config as unknown as Record<string, unknown>,
	})
}

const errorMessage = (err: unknown, conflictHint: string): string => {
	const msg = err instanceof Error ? err.message : "Operation failed"
	return msg.includes("UNIQUE") ? conflictHint : msg
}
