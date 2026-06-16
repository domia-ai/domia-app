import fullHub from "./system-templates/full-hub.json"
import thinClient from "./system-templates/thin-client.json"
import homeAssistant from "./system-templates/home-assistant.json"
import type { ConfigSnapshot } from "@/types/config"

export const SYSTEM_TEMPLATES: {
	id: string
	name: string
	description: string
	config: ConfigSnapshot
}[] = [
	{
		id: "system:full-hub",
		name: "Full hub",
		description:
			"Runs the whole pipeline locally — STT, LLM, TTS and intents — and serves other Domias over the mesh. Mic, wake-word and playback stay off until the device needs them.",
		config: fullHub as unknown as ConfigSnapshot,
	},
	{
		id: "system:thin-client",
		name: "Thin client",
		description:
			"Wake word, microphone and playback. Delegates STT, LLM and TTS to a hub over the mesh.",
		config: thinClient as unknown as ConfigSnapshot,
	},
	{
		id: "system:home-assistant",
		name: "Home Assistant room device",
		description:
			"A thin room device (wake word, mic, playback) that controls Home Assistant over MCP — tools run locally on the device while STT, LLM and TTS delegate to a hub over the mesh. After applying, set the provider URL and paste a long-lived token in the Skills section, and point STT/LLM/TTS delegations at your hub.",
		config: homeAssistant as unknown as ConfigSnapshot,
	},
]
