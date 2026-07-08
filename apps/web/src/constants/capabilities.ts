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
import { m } from "@/paraglide/messages"
import type { CapabilityKey } from "@/types"

export const CAPABILITY_META: Record<
	CapabilityKey,
	{ label: () => string; short: () => string; icon: LucideIcon }
> = {
	wakeword: {
		label: m.enum_capability_wakeword,
		short: m.enum_capability_wakeword_short,
		icon: Radio,
	},
	record: {
		label: m.enum_capability_record,
		short: m.enum_capability_record_short,
		icon: Mic,
	},
	stt: {
		label: m.enum_capability_stt,
		short: m.enum_capability_stt_short,
		icon: Ear,
	},
	intentDetection: {
		label: m.enum_capability_intent_detection,
		short: m.enum_capability_intent_detection_short,
		icon: Crosshair,
	},
	intentExecution: {
		label: m.enum_capability_intent_execution,
		short: m.enum_capability_intent_execution_short,
		icon: Play,
	},
	promptGeneration: {
		label: m.enum_capability_prompt_generation,
		short: m.enum_capability_prompt_generation_short,
		icon: FileText,
	},
	llm: {
		label: m.enum_capability_llm,
		short: m.enum_capability_llm_short,
		icon: Brain,
	},
	tts: {
		label: m.enum_capability_tts,
		short: m.enum_capability_tts_short,
		icon: AudioLines,
	},
	playback: {
		label: m.enum_capability_playback,
		short: m.enum_capability_playback_short,
		icon: Volume2,
	},
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
