import { resolveNodeBase } from "@/services/fleet"
import { createConfigTemplate } from "@/services/templates"
import { nodeExportMind, nodeImportMind } from "@/lib/node-client"
import { mindBundleSchema } from "@/schemas/mind-transfer"
import { CONFIG_SCHEMA_SNAPSHOT } from "@/constants/config-schema"
import { EMOTION_KEYS } from "@/constants/emotions"
import {
	MIND_CHARACTER_SECTION,
	MIND_EMOTION_SECTION,
} from "@/constants/mind-transfer"
import { nodeFailure } from "@/utils/service-errors"
import type { ActionResult } from "@/types"
import type { AppTemplate } from "@/types/mind"
import type { ConfigSnapshot, JsonObject, JsonValue } from "@/types/config"
import type {
	MindBundle,
	MindExportInput,
	MindImportInput,
	MindImportReport,
	MindSectionData,
	SavePersonaTemplateInput,
} from "@/types/mind-transfer"

const BUNDLE_INVALID = "This file is not a Domia mind bundle"

const parseMindBundle = (raw: string): MindBundle | null => {
	try {
		const parsed = mindBundleSchema.safeParse(JSON.parse(raw))
		return parsed.success ? parsed.data : null
	} catch {
		return null
	}
}

export const exportMind = async ({
	domiaKey,
	sections,
}: MindExportInput): Promise<ActionResult<MindBundle>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		return {
			ok: true,
			data: await nodeExportMind(base.data, domiaKey, sections),
		}
	} catch (err) {
		return nodeFailure(err, "Could not export this mind")
	}
}

export const importMind = async ({
	domiaKey,
	bundleJson,
	mode,
	sections,
}: MindImportInput): Promise<ActionResult<MindImportReport>> => {
	const bundle = parseMindBundle(bundleJson)
	if (!bundle) return { ok: false, error: BUNDLE_INVALID }
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		return {
			ok: true,
			data: await nodeImportMind(base.data, domiaKey, {
				bundle,
				mode,
				sections,
			}),
		}
	} catch (err) {
		return nodeFailure(err, "Could not import this mind")
	}
}

const rowObject = (
	section: MindSectionData,
	index: number,
): Record<string, unknown> =>
	Object.fromEntries(
		section.columns.map((column, i) => [column, section.rows[index]?.[i]]),
	)

const activeRow = (
	section: MindSectionData | undefined,
): Record<string, unknown> | null => {
	if (!section || section.rows.length === 0) return null
	const rows = section.rows.map((_, index) => rowObject(section, index))
	return (
		rows.find((row) => row.is_active === 1 || row.is_active === true) ?? rows[0]
	)
}

const characterFields = () =>
	CONFIG_SCHEMA_SNAPSHOT.sections.find((s) => s.id === "character")?.fields ??
	[]

const jsonCell = (value: unknown): JsonValue => {
	if (typeof value !== "string") return (value ?? null) as JsonValue
	try {
		return JSON.parse(value) as JsonValue
	} catch {
		return value
	}
}

const personaCharacter = (
	section: MindSectionData | undefined,
): JsonObject | null => {
	const row = activeRow(section)
	if (!row) return null
	const out: JsonObject = {}
	for (const field of characterFields()) {
		if (!(field.column in row)) continue
		const value = row[field.column]
		out[field.key] =
			field.type === "json" ? jsonCell(value) : ((value ?? null) as JsonValue)
	}
	return out
}

const personaEmotion = (
	section: MindSectionData | undefined,
): JsonObject | null => {
	const row = activeRow(section)
	if (!row) return null
	const out: JsonObject = {}
	for (const key of EMOTION_KEYS)
		if (typeof row[key] === "number") out[key] = row[key]
	return Object.keys(out).length > 0 ? out : null
}

const personaSnapshot = (
	bundle: MindBundle,
	character: JsonObject,
): ConfigSnapshot => ({
	domia: {},
	character,
	emotion: personaEmotion(bundle.sections[MIND_EMOTION_SECTION]),
	modules: null,
	capabilities: null,
	stt: null,
	tts: null,
	llm: null,
	wakeWord: null,
	playback: null,
	mqttLocal: null,
	skillProviders: [],
	delegations: [],
})

export const savePersonaTemplate = ({
	name,
	description,
	bundleJson,
}: SavePersonaTemplateInput): ActionResult<AppTemplate> => {
	const bundle = parseMindBundle(bundleJson)
	if (!bundle) return { ok: false, error: BUNDLE_INVALID }
	const character = personaCharacter(bundle.sections[MIND_CHARACTER_SECTION])
	if (!character)
		return { ok: false, error: "This bundle carries no character profile" }
	return createConfigTemplate({
		name,
		description,
		config: personaSnapshot(bundle, character),
	})
}
