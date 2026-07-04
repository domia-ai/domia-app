import standalone from "./system-templates/standalone.json"
import fullHub from "./system-templates/full-hub.json"
import thinClient from "./system-templates/thin-client.json"
import homeAssistant from "./system-templates/home-assistant.json"
import jetson from "./system-templates/jetson.json"
import snappy from "./system-templates/snappy.json"
import balanced from "./system-templates/balanced.json"
import rich from "./system-templates/rich.json"
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
	{
		id: "system:snappy",
		name: "Snappy",
		description:
			"Standalone tuned for the lowest time-to-first-audio — a fast 3B model (llama3.2:3b) and Parakeet STT (accurate, punctuation + case), with a minimal prompt: no emotion, facts or recent-turn memory injected on the hot path (capture still runs, so nothing is lost). Trades rich context for responsiveness — a snappy ~1s TTFA on a capable machine. Pull llama3.2:3b in Ollama and run `npm run setup:models:parakeet` first.",
		config: snappy as unknown as ConfigSnapshot,
	},
	{
		id: "system:balanced",
		name: "Balanced",
		description:
			"The middle of the quality ladder — fast 3B voice loop (Parakeet + Kokoro, speculation on) WITH the companion layers on: emotion, memory window, facts. Reflection runs on a separate 1B model so it never evicts the voice KV cache. Pull llama3.2:3b and llama3.2:1b in Ollama first.",
		config: balanced as unknown as ConfigSnapshot,
	},
	{
		id: "system:rich",
		name: "Rich",
		description:
			"Top of the quality ladder — 8B model for fuller, more personal replies, wider memory window, all companion layers on, reflection on a separate 3B. Slower per turn; for capable machines. Pull llama3.1:8b and llama3.2:3b in Ollama first.",
		config: rich as unknown as ConfigSnapshot,
	},
]
