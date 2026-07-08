import { useMemo, useState } from "react"
import { m } from "@/paraglide/messages"
import { CONFIG_SECTIONS } from "@/constants/config"
import { validateField } from "@/utils/config-validation"
import type {
	ConfigDraft,
	ConfigField,
	ConfigSnapshot,
	DomiaSkillDescriptor,
	DraftImpact,
	FieldValue,
	JsonObject,
	SkillDescriptorI18n,
	SkillExecutionDescriptor,
	SkillFinalizeRule,
	SkillProviderDraft,
	SkillRoutingDescriptor,
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

const normalizeDescriptor = (raw: unknown): DomiaSkillDescriptor | undefined =>
	raw && typeof raw === "object" && !Array.isArray(raw)
		? (raw as DomiaSkillDescriptor)
		: undefined

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
		descriptor: normalizeDescriptor(r.descriptor),
	}))

const trimList = (arr?: string[]): string[] | undefined => {
	const out = (arr ?? []).map((s) => s.trim()).filter(Boolean)
	return out.length ? out : undefined
}

const trimStringMap = (
	map?: Record<string, string[]>,
): Record<string, string[]> | undefined => {
	const out: Record<string, string[]> = {}
	for (const [k, v] of Object.entries(map ?? {})) {
		const key = k.trim()
		const vals = trimList(v)
		if (key && vals) out[key] = vals
	}
	return Object.keys(out).length ? out : undefined
}

const trimEnumMap = (
	map?: Record<string, "allow" | "block">,
): Record<string, "allow" | "block"> | undefined => {
	const out: Record<string, "allow" | "block"> = {}
	for (const [k, v] of Object.entries(map ?? {})) {
		const key = k.trim()
		if (key && (v === "allow" || v === "block")) out[key] = v
	}
	return Object.keys(out).length ? out : undefined
}

const pruneFinalizeMap = (
	map?: Record<string, SkillFinalizeRule>,
): Record<string, SkillFinalizeRule> | undefined => {
	const out: Record<string, SkillFinalizeRule> = {}
	for (const [k, v] of Object.entries(map ?? {})) {
		const key = k.trim()
		if (!key || !v?.mode) continue
		const rule: SkillFinalizeRule = { mode: v.mode }
		if (v.ack?.trim()) rule.ack = v.ack.trim()
		if (v.error?.trim()) rule.error = v.error.trim()
		if (v.done?.trim()) rule.done = v.done.trim()
		if (typeof v.ackAfterMs === "number" && Number.isFinite(v.ackAfterMs))
			rule.ackAfterMs = v.ackAfterMs
		out[key] = rule
	}
	return Object.keys(out).length ? out : undefined
}

const pruneRouting = (
	r?: SkillRoutingDescriptor,
): SkillRoutingDescriptor | undefined => {
	if (!r) return undefined
	const out: SkillRoutingDescriptor = {}
	const aliases = trimStringMap(r.aliases)
	const examples = trimList(r.exampleUtterances)
	const keywords = trimList(r.keywords)
	if (aliases) out.aliases = aliases
	if (examples) out.exampleUtterances = examples
	if (keywords) out.keywords = keywords
	return Object.keys(out).length ? out : undefined
}

const pruneExecution = (
	e?: SkillExecutionDescriptor,
): SkillExecutionDescriptor | undefined => {
	if (!e) return undefined
	const out: SkillExecutionDescriptor = {}
	const coreTools = trimList(e.coreTools)
	const toolPolicy = trimEnumMap(e.toolPolicy)
	const paramAllow = trimStringMap(e.paramAllow)
	const finalize = pruneFinalizeMap(e.finalize)
	const generic = trimList(e.genericWords)
	if (coreTools) out.coreTools = coreTools
	if (toolPolicy) out.toolPolicy = toolPolicy
	if (paramAllow) out.paramAllow = paramAllow
	if (finalize) out.finalize = finalize
	if (generic) out.genericWords = generic
	return Object.keys(out).length ? out : undefined
}

const pruneI18n = (
	map?: Record<string, SkillDescriptorI18n>,
): Record<string, SkillDescriptorI18n> | undefined => {
	const out: Record<string, SkillDescriptorI18n> = {}
	for (const [loc, v] of Object.entries(map ?? {})) {
		const entry: SkillDescriptorI18n = {}
		const aliases = trimStringMap(v.aliases)
		const examples = trimList(v.exampleUtterances)
		const keywords = trimList(v.keywords)
		const finalize = pruneFinalizeMap(v.finalize)
		const generic = trimList(v.genericWords)
		if (aliases) entry.aliases = aliases
		if (examples) entry.exampleUtterances = examples
		if (keywords) entry.keywords = keywords
		if (finalize) entry.finalize = finalize
		if (generic) entry.genericWords = generic
		if (Object.keys(entry).length) out[loc] = entry
	}
	return Object.keys(out).length ? out : undefined
}

const pruneDescriptor = (
	d?: DomiaSkillDescriptor,
): DomiaSkillDescriptor | undefined => {
	if (!d) return undefined
	const out: DomiaSkillDescriptor = { version: 1 }
	if (d.kind?.trim()) out.kind = d.kind.trim()
	if (d.description?.trim()) out.description = d.description.trim()
	const routing = pruneRouting(d.routing)
	if (routing) out.routing = routing
	const execution = pruneExecution(d.execution)
	if (execution) out.execution = execution
	const i18n = pruneI18n(d.i18n)
	if (i18n) out.i18n = i18n
	const hasContent =
		out.kind || out.description || out.routing || out.execution || out.i18n
	return hasContent ? out : undefined
}

const descriptorValid = (d?: DomiaSkillDescriptor): boolean => {
	if (!d) return true
	for (const rule of Object.values(d.execution?.finalize ?? {})) {
		if (
			rule.ackAfterMs != null &&
			!(Number.isFinite(rule.ackAfterMs) && rule.ackAfterMs >= 0)
		)
			return false
	}
	for (const v of Object.values(d.execution?.toolPolicy ?? {}))
		if (v !== "allow" && v !== "block") return false
	return true
}

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
	const descriptor = pruneDescriptor(s.descriptor)
	if (descriptor) out.descriptor = descriptor as unknown as JsonObject
	return out
}

const toSnapshotServer = (s: SkillProviderDraft): JsonObject => {
	const descriptor = pruneDescriptor(s.descriptor)
	return {
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
		...(descriptor ? { descriptor: descriptor as unknown as JsonObject } : {}),
	}
}

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
			return { section: s.id, label: s.label(), changed }
		}).filter((s) => s.changed.length > 0)
		if (skillChanged)
			sections.push({
				section: SKILL_SECTION_ID,
				label: m.config_section_skills(),
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
			(s.authKind !== "headers" || isValidHeadersJson(s.headers)) &&
			descriptorValid(s.descriptor),
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
