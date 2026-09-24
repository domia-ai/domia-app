import {
	DEFAULT_SKILL_TRUST_TIER,
	SKILL_TOOL_NAME_SEPARATOR,
	SKILL_TOOL_POLICY_VALUES,
	SKILL_TRUST_TIER_VALUES,
} from "@/constants/skills"
import { descriptorErrors } from "@/schemas/descriptor"
import type {
	DomiaSkillDescriptor,
	JsonObject,
	JsonValue,
	SkillDescriptorI18n,
	SkillExecutionDescriptor,
	SkillFastPathBlock,
	SkillFastPathIntent,
	SkillFinalizeRule,
	SkillProviderDraft,
	SkillProviderTransport,
	SkillRoutingDescriptor,
} from "@/types/config"
import type { FastPathSlot, FastPathSlotSource } from "@/types/routines"
import type { SkillToolPolicy, SkillTrustTier } from "@/types/skills"

export const skillToolBaseName = (rawName: string): string => {
	const idx = rawName.lastIndexOf(SKILL_TOOL_NAME_SEPARATOR)
	return idx >= 0
		? rawName.slice(idx + SKILL_TOOL_NAME_SEPARATOR.length)
		: rawName
}

const normalizeProtocol = (raw: unknown): SkillProviderDraft["protocol"] =>
	raw === "http" || raw === "mqtt" || raw === "builtin" ? raw : "mcp"

const normalizeTransport = (raw: unknown): SkillProviderTransport =>
	raw === "sse" || raw === "stdio" ? raw : "http"

export const isBuiltinSkillProvider = (s: SkillProviderDraft): boolean =>
	s.protocol === "builtin"

const normalizeTrustTier = (raw: unknown): SkillTrustTier =>
	SKILL_TRUST_TIER_VALUES.includes(raw as SkillTrustTier)
		? (raw as SkillTrustTier)
		: DEFAULT_SKILL_TRUST_TIER

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

export const normalizeSkillProviders = (
	rows: JsonObject[] | undefined,
): SkillProviderDraft[] =>
	(rows ?? []).map((r) => ({
		id: String(r.id ?? ""),
		name: String(r.name ?? ""),
		protocol: normalizeProtocol(r.protocol),
		type: normalizeTransport(r.type),
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
		trustTier: normalizeTrustTier(r.trustTier),
		descriptor: normalizeDescriptor(r.descriptor),
		serverDescriptor: normalizeDescriptor(r.serverDescriptor),
		serverDescriptorHash:
			typeof r.serverDescriptorHash === "string"
				? r.serverDescriptorHash
				: null,
	}))

const passThrough = <T>(value: T | undefined): T | undefined =>
	value && typeof value === "object" && Object.keys(value).length
		? value
		: undefined

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
	map?: Record<string, SkillToolPolicy>,
): Record<string, SkillToolPolicy> | undefined => {
	const out: Record<string, SkillToolPolicy> = {}
	for (const [k, v] of Object.entries(map ?? {})) {
		const key = k.trim()
		if (key && SKILL_TOOL_POLICY_VALUES.includes(v)) out[key] = v
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

const trimTextMap = (
	map?: Record<string, string>,
): Record<string, string> | undefined => {
	const out: Record<string, string> = {}
	for (const [k, v] of Object.entries(map ?? {})) {
		const key = k.trim()
		const value = v?.trim()
		if (key && value) out[key] = value
	}
	return Object.keys(out).length ? out : undefined
}

const pruneSlotSource = (
	source?: FastPathSlotSource,
): FastPathSlotSource | undefined => {
	if (!source) return undefined
	if (source.kind === "context") {
		const key = source.key.trim()
		return key ? { kind: "context", key } : undefined
	}
	if (source.kind === "enum") {
		const values = trimList(source.values)
		return values ? { kind: "enum", values } : undefined
	}
	if (source.kind === "map") {
		const values = source.values
			.map((entry) => ({ in: trimList(entry.in), out: entry.out }))
			.filter((entry): entry is { in: string[]; out: JsonValue } => !!entry.in)
		return values.length ? { kind: "map", values } : undefined
	}
	if (source.kind === "schemaEnum") {
		const arg = source.arg.trim()
		return arg ? { kind: "schemaEnum", arg } : undefined
	}
	if (source.kind === "range")
		return Number.isFinite(source.min) && Number.isFinite(source.max)
			? { kind: "range", min: source.min, max: source.max }
			: undefined
	if (source.kind === "duration")
		return typeof source.maxSeconds === "number" &&
			Number.isFinite(source.maxSeconds) &&
			source.maxSeconds > 0
			? { kind: "duration", maxSeconds: source.maxSeconds }
			: { kind: "duration" }
	return { kind: "clockTime" }
}

const pruneSlots = (
	map?: Record<string, FastPathSlot>,
): Record<string, FastPathSlot> | undefined => {
	const out: Record<string, FastPathSlot> = {}
	for (const [k, v] of Object.entries(map ?? {})) {
		const name = k.trim()
		const source = pruneSlotSource(v?.source)
		if (!name || !source) continue
		const arg = v.arg?.trim()
		out[name] = arg ? { source, arg } : { source }
	}
	return Object.keys(out).length ? out : undefined
}

const pruneKeywordGroups = (groups?: string[][]): string[][] | undefined => {
	const out = (groups ?? [])
		.map(trimList)
		.filter((group): group is string[] => !!group)
	return out.length ? out : undefined
}

const pruneArgDefaults = (
	map?: Record<string, JsonValue>,
): Record<string, JsonValue> | undefined => {
	const out: Record<string, JsonValue> = {}
	for (const [k, v] of Object.entries(map ?? {})) {
		const key = k.trim()
		if (key && v !== undefined && v !== "") out[key] = v
	}
	return Object.keys(out).length ? out : undefined
}

const pruneIntent = (
	intent: SkillFastPathIntent,
): SkillFastPathIntent | undefined => {
	const tool = intent.tool?.trim()
	const templates = trimList(intent.templates)
	if (!tool || !templates) return undefined
	const out: SkillFastPathIntent = { tool, templates }
	const slots = pruneSlots(intent.slots)
	const requiredKeywords = pruneKeywordGroups(intent.requiredKeywords)
	const argDefaults = pruneArgDefaults(intent.argDefaults)
	if (slots) out.slots = slots
	if (requiredKeywords) out.requiredKeywords = requiredKeywords
	if (argDefaults) out.argDefaults = argDefaults
	if (typeof intent.priority === "number" && Number.isInteger(intent.priority))
		out.priority = intent.priority
	if (intent.allowBlockedTokens === true) out.allowBlockedTokens = true
	return out
}

const pruneFastPath = (
	block?: SkillFastPathBlock,
): SkillFastPathBlock | undefined => {
	if (!block) return undefined
	const intents = (block.intents ?? []).flatMap((intent) => {
		const pruned = pruneIntent(intent)
		return pruned ? [pruned] : []
	})
	const expansionRules = trimTextMap(block.expansionRules)
	if (!intents.length && !expansionRules) return undefined
	const out: SkillFastPathBlock = { intents }
	if (expansionRules) out.expansionRules = expansionRules
	return out
}

export const fastPathIntentDropped = (block?: SkillFastPathBlock): number =>
	(block?.intents ?? []).filter((intent) => !pruneIntent(intent)).length

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
	const hiddenTools = trimList(e.hiddenTools)
	const toolPolicy = trimEnumMap(e.toolPolicy)
	const toolHints = passThrough(e.toolHints)
	const paramAllow = trimStringMap(e.paramAllow)
	const argNormalize = passThrough(e.argNormalize)
	const finalize = pruneFinalizeMap(e.finalize)
	const generic = trimList(e.genericWords)
	const resilience = passThrough(e.resilience)
	if (coreTools) out.coreTools = coreTools
	if (hiddenTools) out.hiddenTools = hiddenTools
	if (toolPolicy) out.toolPolicy = toolPolicy
	if (toolHints) out.toolHints = toolHints
	if (paramAllow) out.paramAllow = paramAllow
	if (argNormalize) out.argNormalize = argNormalize
	if (finalize) out.finalize = finalize
	if (generic) out.genericWords = generic
	if (resilience) out.resilience = resilience
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
		const fastPath = pruneFastPath(v.fastPath)
		if (aliases) entry.aliases = aliases
		if (examples) entry.exampleUtterances = examples
		if (keywords) entry.keywords = keywords
		if (finalize) entry.finalize = finalize
		if (generic) entry.genericWords = generic
		if (fastPath) entry.fastPath = fastPath
		if (Object.keys(entry).length) out[loc] = entry
	}
	return Object.keys(out).length ? out : undefined
}

export const pruneDescriptor = (
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
	const fastPath = pruneFastPath(d.fastPath)
	if (fastPath) out.fastPath = fastPath
	const i18n = pruneI18n(d.i18n)
	if (i18n) out.i18n = i18n
	const hasContent =
		out.kind ||
		out.description ||
		out.routing ||
		out.execution ||
		out.fastPath ||
		out.i18n
	return hasContent ? out : undefined
}

export const descriptorIssues = (d?: DomiaSkillDescriptor): string[] =>
	descriptorErrors(pruneDescriptor(d))

const descriptorValid = (d?: DomiaSkillDescriptor): boolean =>
	descriptorIssues(d).length === 0

export const skillProviderValid = (s: SkillProviderDraft): boolean =>
	s.name.trim() !== "" &&
	(isBuiltinSkillProvider(s) || s.type === "stdio" || s.url.trim() !== "") &&
	isValidConfigJson(s.config) &&
	(s.authKind !== "headers" || isValidHeadersJson(s.headers)) &&
	descriptorValid(s.descriptor)

export const skillProviderToBundle = (s: SkillProviderDraft): JsonObject => {
	const out: JsonObject = {
		name: s.name.trim(),
		protocol: s.protocol,
		type: s.type,
		url: s.url.trim(),
		toolWhitelist: s.whitelist.length ? s.whitelist : null,
		trustTier: s.trustTier,
	}
	if (s.id) out.id = s.id
	if (s.authKind === "none") out.auth = null
	if (s.authKind === "bearer" && s.token.trim())
		out.auth = { kind: "bearer", token: s.token.trim() }
	if (s.authKind === "headers" && s.headers.trim())
		out.auth = { kind: "headers", headers: JSON.parse(s.headers) }
	out.config = s.config.trim() ? JSON.parse(s.config) : null
	const descriptor = pruneDescriptor(s.descriptor)
	out.descriptor = descriptor ? (descriptor as unknown as JsonObject) : null
	return out
}

export const skillProviderToSnapshot = (s: SkillProviderDraft): JsonObject => {
	const descriptor = pruneDescriptor(s.descriptor)
	return {
		id: s.id,
		name: s.name.trim(),
		protocol: s.protocol,
		type: s.type,
		url: s.url.trim(),
		authKind: s.authKind,
		toolWhitelist: s.whitelist.length ? s.whitelist : null,
		trustTier: s.trustTier,
		...(s.config.trim() && isValidConfigJson(s.config)
			? { config: JSON.parse(s.config) }
			: {}),
		...(descriptor ? { descriptor: descriptor as unknown as JsonObject } : {}),
	}
}
