import type { DomiaConfig } from "@/types"
import type { ConfigSnapshot } from "@/types/config"

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
	mcpServerConfigs: [],
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
			mcpServerConfigs:
				(d.mcpServerConfigs as DomiaConfig["mcpServerConfigs"]) ?? [],
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
	mcpServers: config.mcpServerConfigs.map(
		(s) => stripMeta(s) as ConfigSnapshot["mcpServers"][number],
	),
	delegations: config.capabilityDelegations.map(
		(d) => stripMeta(d) as ConfigSnapshot["delegations"][number],
	),
})
