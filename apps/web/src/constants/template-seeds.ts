import fullHub from "./system-templates/full-hub.json"
import thinClient from "./system-templates/thin-client.json"
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
]
