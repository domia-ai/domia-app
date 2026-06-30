import standalone from "./system-templates/standalone.json"
import fullHub from "./system-templates/full-hub.json"
import thinClient from "./system-templates/thin-client.json"
import homeAssistant from "./system-templates/home-assistant.json"
import jetson from "./system-templates/jetson.json"
import type { ConfigSnapshot } from "@/types/config"

export const SYSTEM_TEMPLATES: {
	id: string
	name: string
	description: string
	config: ConfigSnapshot
}[] = [
	{
		id: "system:standalone",
		name: "Standalone",
		description:
			"Everything on one machine — wake word, mic, STT, LLM, TTS and playback all run locally. Say the wake word and it listens and replies, fully offline. The right choice for a single smart speaker.",
		config: standalone as unknown as ConfigSnapshot,
	},
	{
		id: "system:full-hub",
		name: "Inference hub",
		description:
			"A headless brain — runs STT, LLM, TTS and intents for the mesh, with no mic and no wake word: it does not listen on its own. Other Domias (a thin client, or a thin identity on the same machine) delegate their inference to it automatically. For a machine that powers a home, not a standalone speaker.",
		config: fullHub as unknown as ConfigSnapshot,
	},
	{
		id: "system:thin-client",
		name: "Thin client",
		description:
			"Ears and voice only — wake word, mic and playback. It captures speech, then delegates STT, LLM and TTS to whatever capable Domia is nearest on the mesh (an Inference hub, or a full Domia on the same machine) — no delegation setup needed. For low-power edge devices.",
		config: thinClient as unknown as ConfigSnapshot,
	},
	{
		id: "system:home-assistant",
		name: "Home Assistant room device",
		description:
			"A thin room device (wake word, mic, playback) that controls Home Assistant over MCP — tools run locally while STT, LLM and TTS auto-delegate to a capable Domia on the mesh. After applying, set the provider URL and paste a long-lived token in the Skills section.",
		config: homeAssistant as unknown as ConfigSnapshot,
	},
	{
		id: "system:jetson",
		name: "Jetson Orin Nano",
		description:
			"Full local pipeline tuned for the NVIDIA Jetson Orin Nano — a small 3B model that fits the 8 GB unified memory, with the LLM on the GPU and STT/TTS on CPU. A starting point: the exact 3B model and quantization are still to be confirmed against on-device benchmarks. Pull the model in Ollama first.",
		config: jetson as unknown as ConfigSnapshot,
	},
]
