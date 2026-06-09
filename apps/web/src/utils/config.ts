import type { DomiaConfig } from "@/types"

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
