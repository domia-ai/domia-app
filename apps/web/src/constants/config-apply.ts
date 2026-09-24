import { m } from "@/paraglide/messages"
import type { ConfigApplySubsystemId } from "@/types/config"

export const SUBSYSTEM_LABELS: Record<ConfigApplySubsystemId, () => string> = {
	"stt-pool": m.apply_sub_stt_pool,
	"tts-pool": m.apply_sub_tts_pool,
	llm: m.apply_sub_llm,
	"voice-listener": m.apply_sub_voice_listener,
	mqtt: m.apply_sub_mqtt,
	skills: m.apply_sub_skills,
	satellites: m.apply_sub_satellites,
	identity: m.apply_sub_identity,
	proactivity: m.apply_sub_proactivity,
	"voice-feel": m.apply_sub_voice_feel,
}

export const subsystemLabel = (subsystem: string): string =>
	SUBSYSTEM_LABELS[subsystem as ConfigApplySubsystemId]?.() ?? subsystem

export const LLM_SLOT_LABELS: Record<string, () => string> = {
	waits: m.health_llm_slot_waits,
	waitTimeouts: m.health_llm_slot_wait_timeouts,
	reassignments: m.health_llm_slot_reassignments,
	invalidations: m.health_llm_slot_invalidations,
	degradedSessions: m.health_llm_slot_degraded_sessions,
	backgroundOnSharedSlot: m.health_llm_slot_background_on_shared,
}
