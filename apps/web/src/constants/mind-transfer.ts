import { m } from "@/paraglide/messages"
import type { MindSection, MindSectionCountKey } from "@/types/mind-transfer"

export const MIND_BUNDLE_VERSION = 1

export const MIND_SECTIONS = [
	"emotion_state",
	"character_profile",
	"user_model",
	"memory_fact",
	"fact_evidence",
	"knowledge_entry",
	"memory_episode",
	"emotion_event",
	"proactive_schedule",
	"satellite_config",
	"skill_provider",
	"routine",
] as const

export const MIND_IMPORT_MODES = ["merge", "replace"] as const

export const MIND_CHARACTER_SECTION = "character_profile"

export const MIND_EMOTION_SECTION = "emotion_state"

export const MIND_SECTION_LABELS: Record<MindSection, () => string> = {
	emotion_state: m.mind_export_section_emotion_state,
	character_profile: m.mind_export_section_character_profile,
	user_model: m.mind_export_section_user_model,
	memory_fact: m.mind_export_section_memory_fact,
	fact_evidence: m.mind_export_section_fact_evidence,
	knowledge_entry: m.mind_export_section_knowledge_entry,
	memory_episode: m.mind_export_section_memory_episode,
	emotion_event: m.mind_export_section_emotion_event,
	proactive_schedule: m.mind_export_section_proactive_schedule,
	satellite_config: m.mind_export_section_satellite_config,
	skill_provider: m.mind_export_section_skill_provider,
	routine: m.mind_export_section_routine,
}

export const MIND_REPORT_COUNTS: {
	key: MindSectionCountKey
	label: () => string
}[] = [
	{ key: "inserted", label: m.mind_import_count_inserted },
	{ key: "matched", label: m.mind_import_count_matched },
	{ key: "remapped", label: m.mind_import_count_remapped },
	{ key: "reidentified", label: m.mind_import_count_reidentified },
	{ key: "cleared", label: m.mind_import_count_cleared },
]
