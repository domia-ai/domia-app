import {
	AudioLines,
	Brain,
	Crosshair,
	Ear,
	FileText,
	Mic,
	Play,
	Radio,
	Volume2,
	type LucideIcon,
} from "lucide-react"
import type { CapabilityKey } from "@/types"

export const CAPABILITY_META: Record<
	CapabilityKey,
	{ label: string; short: string; icon: LucideIcon }
> = {
	wakeword: { label: "Wake word", short: "Wake", icon: Radio },
	record: { label: "Record", short: "Rec", icon: Mic },
	stt: { label: "Speech to text", short: "STT", icon: Ear },
	intentDetection: {
		label: "Intent detection",
		short: "Intent",
		icon: Crosshair,
	},
	intentExecution: { label: "Intent execution", short: "Exec", icon: Play },
	promptGeneration: {
		label: "Prompt generation",
		short: "Prompt",
		icon: FileText,
	},
	llm: { label: "Language model", short: "LLM", icon: Brain },
	tts: { label: "Text to speech", short: "TTS", icon: AudioLines },
	playback: { label: "Playback", short: "Play", icon: Volume2 },
}

export const CAPABILITY_ORDER: CapabilityKey[] = [
	"wakeword",
	"record",
	"stt",
	"intentDetection",
	"intentExecution",
	"promptGeneration",
	"llm",
	"tts",
	"playback",
]
