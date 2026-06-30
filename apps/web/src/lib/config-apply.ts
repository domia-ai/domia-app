import type { ConfigApplyResult } from "@/types/config"

const SUBSYSTEM_LABELS: Record<string, string> = {
	"stt-pool": "STT pool",
	"tts-pool": "TTS pool",
	mqtt: "MQTT",
	"voice-listener": "voice listener",
	skills: "skills",
	satellites: "satellites",
	identity: "identity",
	config: "settings",
	"live-drain": "settings",
}

const label = (subsystem: string): string =>
	SUBSYSTEM_LABELS[subsystem] ?? subsystem

export const summarizeApply = (apply: ConfigApplyResult): string => {
	if (apply.result === "restart")
		return "Restarting to apply (structural change)."

	const reloaded = apply.subsystems
		.filter((s) => s.status === "reloaded")
		.map((s) => label(s.subsystem))
	const failed = apply.subsystems.filter((s) => s.status === "failed")

	if (failed.length > 0) {
		const failedText = failed
			.map(
				(s) =>
					`${label(s.subsystem)} failed (kept previous, running rev ${
						s.runningRevision ?? "?"
					})`,
			)
			.join(", ")
		const okText = reloaded.length ? ` Reloaded: ${reloaded.join(", ")}.` : ""
		return `${failedText}.${okText}`
	}

	if (reloaded.length > 0) return `Reloaded live: ${reloaded.join(", ")}.`

	return "Applied live — no restart needed."
}
