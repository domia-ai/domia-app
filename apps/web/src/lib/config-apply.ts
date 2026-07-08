import { m } from "@/paraglide/messages"
import type { ConfigApplyResult } from "@/types/config"

const SUBSYSTEM_LABELS: Record<string, () => string> = {
	"stt-pool": m.apply_sub_stt_pool,
	"tts-pool": m.apply_sub_tts_pool,
	mqtt: () => "MQTT",
	"voice-listener": m.apply_sub_voice_listener,
	skills: m.apply_sub_skills,
	satellites: m.apply_sub_satellites,
	identity: m.apply_sub_identity,
	config: m.apply_sub_settings,
	"live-drain": m.apply_sub_settings,
}

const label = (subsystem: string): string =>
	SUBSYSTEM_LABELS[subsystem]?.() ?? subsystem

export const summarizeApply = (apply: ConfigApplyResult): string => {
	if (apply.result === "restart") return m.apply_restarting()

	const reloaded = apply.subsystems
		.filter((s) => s.status === "reloaded")
		.map((s) => label(s.subsystem))
	const failed = apply.subsystems.filter((s) => s.status === "failed")

	if (failed.length > 0) {
		const failedText = failed
			.map((s) =>
				m.apply_failed_item({
					name: label(s.subsystem),
					rev: s.runningRevision ?? "?",
				}),
			)
			.join(", ")
		const okText = reloaded.length
			? ` ${m.apply_reloaded_suffix({ list: reloaded.join(", ") })}`
			: ""
		return `${failedText}.${okText}`
	}

	if (reloaded.length > 0)
		return m.apply_reloaded_live({ list: reloaded.join(", ") })

	return m.apply_live_no_restart()
}
