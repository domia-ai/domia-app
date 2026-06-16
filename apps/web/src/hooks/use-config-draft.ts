import { useMemo, useState } from "react"
import { CONFIG_SECTIONS } from "@/constants/config"
import { validateField } from "@/utils/config-validation"
import type {
	ConfigDraft,
	ConfigField,
	ConfigSnapshot,
	DraftImpact,
	FieldValue,
	JsonObject,
	SkillProviderDraft,
} from "@/types/config"

const EDITABLE = CONFIG_SECTIONS.filter(
	(s) => s.kind === "fields" || s.kind === "radar",
)

const SKILL_SECTION_ID = "skills"

const sourceKey = (sectionId: string): string =>
	EDITABLE.find((s) => s.id === sectionId)?.source ?? sectionId

const coerce = (field: ConfigField, raw: unknown): FieldValue => {
	if (field.kind === "boolean") return Boolean(raw)
	if (field.kind === "number" || field.kind === "slider")
		return raw == null ? 0 : Number(raw)
	if (field.kind === "tags")
		return Array.isArray(raw) ? raw.map((v) => String(v)) : []
	return raw == null ? "" : String(raw)
}

const normalizeProtocol = (raw: unknown): SkillProviderDraft["protocol"] =>
	raw === "http" || raw === "mqtt" ? raw : "mcp"

const normalizeAuthKind = (row: JsonObject): SkillProviderDraft["authKind"] => {
	const direct = row.authKind
	if (direct === "bearer" || direct === "headers" || direct === "none")
		return direct
	const kind = (row.auth as { kind?: unknown })?.kind
	return kind === "bearer" || kind === "headers" ? kind : "none"
}

const isValidConfigJson = (s: string): boolean => {
	if (!s.trim()) return true
	try {
		JSON.parse(s)
		return true
	} catch {
		return false
	}
}

const isValidHeadersJson = (s: string): boolean => {
	if (!s.trim()) return true
	try {
		const parsed = JSON.parse(s)
		return (
			!!parsed &&
			typeof parsed === "object" &&
			!Array.isArray(parsed) &&
			Object.values(parsed).every((v) => typeof v === "string")
		)
	} catch {
		return false
	}
}

const normalizeSkillProviders = (
	rows: JsonObject[] | undefined,
): SkillProviderDraft[] =>
	(rows ?? []).map((r) => ({
		id: String(r.id ?? ""),
		name: String(r.name ?? ""),
		protocol: normalizeProtocol(r.protocol),
		type: r.type === "sse" ? "sse" : "http",
		url: String(r.url ?? ""),
		authKind: normalizeAuthKind(r),
		token: "",
		headers: "",
		whitelist: Array.isArray(r.toolWhitelist)
			? (r.toolWhitelist as unknown[]).map((v) => String(v))
			: [],
		config:
			r.config && typeof r.config === "object"
				? JSON.stringify(r.config, null, 2)
				: "",
	}))

const toBundleServer = (s: SkillProviderDraft): JsonObject => {
	const out: JsonObject = {
		name: s.name.trim(),
		protocol: s.protocol,
		type: s.type,
		url: s.url.trim(),
		toolWhitelist: s.whitelist,
	}
	if (s.id) out.id = s.id
	if (s.authKind === "none") out.auth = null
	if (s.authKind === "bearer" && s.token.trim())
		out.auth = { kind: "bearer", token: s.token.trim() }
	if (s.authKind === "headers" && s.headers.trim())
		out.auth = { kind: "headers", headers: JSON.parse(s.headers) }
	out.config = s.config.trim() ? JSON.parse(s.config) : null
	return out
}

const toSnapshotServer = (s: SkillProviderDraft): JsonObject => ({
	id: s.id,
	name: s.name.trim(),
	protocol: s.protocol,
	type: s.type,
	url: s.url.trim(),
	authKind: s.authKind,
	toolWhitelist: s.whitelist,
	...(s.config.trim() && isValidConfigJson(s.config)
		? { config: JSON.parse(s.config) }
		: {}),
})

const buildBaseline = (config: ConfigSnapshot): ConfigDraft => {
	const byKey = config as unknown as Record<
		string,
		Record<string, unknown> | null
	>
	const draft: ConfigDraft = {}
	for (const section of EDITABLE) {
		const src = byKey[section.source ?? section.id] ?? {}
		const values: Record<string, FieldValue> = {}
		for (const field of section.fields)
			values[field.key] = coerce(field, src[field.key])
		draft[section.id] = values
	}
	return draft
}

const equal = (a: FieldValue, b: FieldValue): boolean => {
	if (Array.isArray(a) || Array.isArray(b))
		return JSON.stringify(a) === JSON.stringify(b)
	return a === b
}

export function useConfigDraft(config: ConfigSnapshot) {
	const [baseline, setBaseline] = useState<ConfigDraft>(() =>
		buildBaseline(config),
	)
	const [draft, setDraft] = useState<ConfigDraft>(() => buildBaseline(config))
	const [skillBaseline, setSkillBaseline] = useState<SkillProviderDraft[]>(() =>
		normalizeSkillProviders(config.skillProviders),
	)
	const [skillProviders, setSkillProviders] = useState<SkillProviderDraft[]>(
		() => normalizeSkillProviders(config.skillProviders),
	)

	const setField = (sectionId: string, key: string, value: FieldValue) =>
		setDraft((prev) => ({
			...prev,
			[sectionId]: { ...prev[sectionId], [key]: value },
		}))

	const setSectionValues = (
		sectionId: string,
		values: Record<string, FieldValue>,
	) =>
		setDraft((prev) => ({
			...prev,
			[sectionId]: { ...prev[sectionId], ...values },
		}))

	const changedKeys = (sectionId: string): string[] => {
		const base = baseline[sectionId] ?? {}
		const cur = draft[sectionId] ?? {}
		return Object.keys(cur).filter((k) => !equal(cur[k], base[k]))
	}

	const skillChanged = useMemo(
		() => JSON.stringify(skillProviders) !== JSON.stringify(skillBaseline),
		[skillProviders, skillBaseline],
	)

	const impact = useMemo((): DraftImpact => {
		const sections = EDITABLE.map((s) => {
			const base = baseline[s.id] ?? {}
			const cur = draft[s.id] ?? {}
			const changed = Object.keys(cur).filter((k) => !equal(cur[k], base[k]))
			return { section: s.id, label: s.label, changed }
		}).filter((s) => s.changed.length > 0)
		if (skillChanged)
			sections.push({
				section: SKILL_SECTION_ID,
				label: "Skills",
				changed: ["servers"],
			})
		return {
			totalChanged: sections.reduce((n, s) => n + s.changed.length, 0),
			sections,
		}
	}, [baseline, draft, skillChanged])

	const errors = useMemo((): Record<string, Record<string, string>> => {
		const map: Record<string, Record<string, string>> = {}
		for (const s of EDITABLE) {
			const cur = draft[s.id] ?? {}
			for (const field of s.fields) {
				const err = validateField(field, cur[field.key])
				if (err) (map[s.id] ??= {})[field.key] = err
			}
		}
		return map
	}, [draft])

	const skillValid = skillProviders.every(
		(s) =>
			s.name.trim() !== "" &&
			s.url.trim() !== "" &&
			isValidConfigJson(s.config) &&
			(s.authKind !== "headers" || isValidHeadersJson(s.headers)),
	)
	const isValid = Object.keys(errors).length === 0 && skillValid

	const fieldError = (sectionId: string, key: string): string | null =>
		errors[sectionId]?.[key] ?? null

	const buildBundle = (): Record<string, unknown> => {
		const bundle: Record<string, unknown> = {}
		for (const s of impact.sections) {
			if (s.section === SKILL_SECTION_ID) continue
			const cur = draft[s.section] ?? {}
			const key = sourceKey(s.section)
			const fields = { ...((bundle[key] as JsonObject) ?? {}) }
			for (const k of s.changed) fields[k] = cur[k]
			bundle[key] = fields
		}
		if (skillChanged) bundle.skillProviders = skillProviders.map(toBundleServer)
		return bundle
	}

	const mergeInto = (base: ConfigSnapshot): ConfigSnapshot => {
		const byKey: Record<string, unknown> = {
			...(base as unknown as Record<string, unknown>),
		}
		for (const s of EDITABLE) {
			const key = s.source ?? s.id
			byKey[key] = {
				...((byKey[key] as Record<string, unknown> | null) ?? {}),
				...(draft[s.id] ?? {}),
			}
		}
		byKey.skillProviders = skillProviders.map(toSnapshotServer)
		return byKey as unknown as ConfigSnapshot
	}

	const reset = () => {
		setDraft(baseline)
		setSkillProviders(skillBaseline)
	}
	const commit = () => {
		setBaseline(draft)
		setSkillBaseline(skillProviders)
	}

	return {
		draft,
		setField,
		setSectionValues,
		changedKeys,
		impact,
		errors,
		isValid,
		fieldError,
		buildBundle,
		mergeInto,
		reset,
		commit,
		skillProviders,
		setSkillProviders,
		skillChanged,
	}
}

export type ConfigDraftApi = ReturnType<typeof useConfigDraft>
