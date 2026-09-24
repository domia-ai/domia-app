import { m } from "@/paraglide/messages"
import type { DomiaConfig } from "@/types"
import type {
	CapabilityDelegation,
	ConfigSnapshot,
	JsonObject,
	ModelJob,
} from "@/types/config"

const UNIT_LABELS: Record<string, () => string> = {
	chars: m.config_unit_chars,
	words: m.config_unit_words,
	sentences: m.config_unit_sentences,
	tokens: m.config_unit_tokens,
	turns: m.config_unit_turns,
	ms: m.config_unit_ms,
	s: m.config_unit_s,
	Hz: m.config_unit_hz,
	bytes: m.config_unit_bytes,
	redirects: m.config_unit_redirects,
	jobs: m.config_unit_jobs,
	passes: m.config_unit_passes,
	entries: m.config_unit_entries,
	days: m.config_unit_days,
}

export const unitLabel = (unit: string): string => UNIT_LABELS[unit]?.() ?? unit

export const modelJobDuration = (job: ModelJob): string | null => {
	if (job.startedAt == null) return null
	const seconds = ((job.finishedAt ?? Date.now()) - job.startedAt) / 1000
	if (seconds < 0) return null
	return seconds < 60
		? `${seconds.toFixed(1)}s`
		: `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`
}

export const modelJobSpecLabel = (job: ModelJob): string | null => {
	const spec = job.spec
	if (!spec) return null
	return spec.label ?? spec.target ?? spec.model ?? spec.url ?? spec.kind
}

const EMPTY_CONFIG: DomiaConfig = {
	characterProfile: null,
	emotionState: null,
	runtimeCapabilities: null,
	moduleSettings: null,
	llmModelConfig: null,
	ttsConfig: null,
	sttConfig: null,
	wakeWordConfig: null,
	capabilityDelegations: [],
	skillProviders: [],
}

export const parseConfigSnapshot = (json: string | null): DomiaConfig => {
	if (!json) return EMPTY_CONFIG
	try {
		const d = JSON.parse(json) as Record<string, unknown>
		return {
			characterProfile:
				(d.characterProfile as DomiaConfig["characterProfile"]) ?? null,
			emotionState: (d.emotionState as DomiaConfig["emotionState"]) ?? null,
			runtimeCapabilities:
				(d.runtimeCapabilities as DomiaConfig["runtimeCapabilities"]) ?? null,
			moduleSettings:
				(d.moduleSettings as DomiaConfig["moduleSettings"]) ?? null,
			llmModelConfig:
				(d.llmModelConfig as DomiaConfig["llmModelConfig"]) ?? null,
			ttsConfig: (d.ttsConfig as DomiaConfig["ttsConfig"]) ?? null,
			sttConfig: (d.sttConfig as DomiaConfig["sttConfig"]) ?? null,
			wakeWordConfig:
				(d.wakeWordConfig as DomiaConfig["wakeWordConfig"]) ?? null,
			capabilityDelegations:
				(d.capabilityDelegations as DomiaConfig["capabilityDelegations"]) ?? [],
			skillProviders: (d.skillProviders as DomiaConfig["skillProviders"]) ?? [],
		}
	} catch {
		return EMPTY_CONFIG
	}
}

const META_KEYS = new Set([
	"id",
	"domiaId",
	"isActive",
	"createdAt",
	"updatedAt",
])

const stripMeta = <T>(row: T | null): ConfigSnapshot["character"] | null => {
	if (!row) return null
	return Object.fromEntries(
		Object.entries(row as Record<string, unknown>).filter(
			([k]) => !META_KEYS.has(k),
		),
	) as ConfigSnapshot["character"]
}

const toDelegation = (d: CapabilityDelegation): CapabilityDelegation => ({
	capability: d.capability,
	delegateToDomiaKey: d.delegateToDomiaKey,
	delegateToDomiaId: d.delegateToDomiaId ?? null,
	priority: d.priority,
})

export const normalizeDelegations = (
	list: CapabilityDelegation[] | null | undefined,
): CapabilityDelegation[] => (list ?? []).map(toDelegation)

export const delegationToBundle = (d: CapabilityDelegation): JsonObject => ({
	capability: d.capability,
	delegateToDomiaKey: d.delegateToDomiaKey.trim(),
	delegateToDomiaId: d.delegateToDomiaId,
	priority: d.priority,
})

export const delegationValid = (d: CapabilityDelegation): boolean =>
	d.delegateToDomiaKey.trim().length > 0 &&
	Number.isInteger(d.priority) &&
	d.priority >= 0

const stripProviderSecret = (s: unknown): Record<string, unknown> => {
	const base = (stripMeta(s as null) ?? {}) as Record<string, unknown>
	const auth = (s as { auth?: { kind?: string } | null })?.auth
	return { ...base, auth: auth?.kind ? { kind: auth.kind } : null }
}

export const configSnapshotToStoredJson = (
	snapshot: ConfigSnapshot,
	name: string,
	domiaKey: string,
): string => {
	const skillProviders = (snapshot.skillProviders ?? []).map((p) => {
		const auth = (p as { auth?: { kind?: string } | null }).auth
		return { ...p, auth: auth?.kind ? { kind: auth.kind } : null }
	})
	return JSON.stringify({
		domiaKey,
		name,
		isActive: true,
		characterProfile: snapshot.character ?? null,
		emotionState: snapshot.emotion ?? null,
		runtimeCapabilities: snapshot.capabilities ?? null,
		moduleSettings: snapshot.modules ?? null,
		llmModelConfig: snapshot.llm ?? null,
		ttsConfig: snapshot.tts ?? null,
		sttConfig: snapshot.stt ?? null,
		wakeWordConfig: snapshot.wakeWord ?? null,
		capabilityDelegations: snapshot.delegations ?? [],
		skillProviders,
	})
}

export const domiaConfigToSnapshot = (
	config: DomiaConfig,
	name: string,
): Partial<ConfigSnapshot> => ({
	domia: { name },
	character: stripMeta(config.characterProfile),
	emotion: stripMeta(config.emotionState),
	modules: stripMeta(config.moduleSettings),
	capabilities: stripMeta(config.runtimeCapabilities),
	stt: stripMeta(config.sttConfig),
	tts: stripMeta(config.ttsConfig),
	llm: stripMeta(config.llmModelConfig),
	wakeWord: stripMeta(config.wakeWordConfig),
	skillProviders: config.skillProviders.map(
		(s) => stripProviderSecret(s) as ConfigSnapshot["skillProviders"][number],
	),
	delegations: config.capabilityDelegations.map(toDelegation),
})
