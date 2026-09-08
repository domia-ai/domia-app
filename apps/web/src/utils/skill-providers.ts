import type {
	DomiaSkillDescriptor,
	JsonObject,
	SkillDescriptorI18n,
	SkillExecutionDescriptor,
	SkillFinalizeRule,
	SkillProviderDraft,
	SkillRoutingDescriptor,
} from "@/types/config"

const normalizeProtocol = (raw: unknown): SkillProviderDraft["protocol"] =>
	raw === "http" || raw === "mqtt" ? raw : "mcp"

const normalizeAuthKind = (row: JsonObject): SkillProviderDraft["authKind"] => {
	const direct = row.authKind
	if (direct === "bearer" || direct === "headers" || direct === "none")
		return direct
	const kind = (row.auth as { kind?: unknown })?.kind
	return kind === "bearer" || kind === "headers" ? kind : "none"
}

export const isValidConfigJson = (s: string): boolean => {
	if (!s.trim()) return true
	try {
		JSON.parse(s)
		return true
	} catch {
		return false
	}
}

export const isValidHeadersJson = (s: string): boolean => {
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
	const i18n = pruneI18n(d.i18n)
	if (i18n) out.i18n = i18n
	const hasContent =
		out.kind || out.description || out.routing || out.execution || out.i18n
	return hasContent ? out : undefined
}

export const descriptorValid = (d?: DomiaSkillDescriptor): boolean => {
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

export const skillProviderValid = (s: SkillProviderDraft): boolean =>
	s.name.trim() !== "" &&
	s.url.trim() !== "" &&
	isValidConfigJson(s.config) &&
	(s.authKind !== "headers" || isValidHeadersJson(s.headers)) &&
	descriptorValid(s.descriptor)

export const skillProviderToBundle = (s: SkillProviderDraft): JsonObject => {
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
		toolWhitelist: s.whitelist,
		...(s.config.trim() && isValidConfigJson(s.config)
			? { config: JSON.parse(s.config) }
			: {}),
		...(descriptor ? { descriptor: descriptor as unknown as JsonObject } : {}),
	}
}
