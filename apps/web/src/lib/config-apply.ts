import { m } from "@/paraglide/messages"
import { LLM_SLOT_LABELS, subsystemLabel } from "@/constants/config-apply"
import { humanizeKey } from "@/utils/config-schema"
import type {
	ConfigApplyResult,
	ConfigApplyState,
	ConfigSnapshot,
} from "@/types/config"

export const llmSlotDisplayLabel = (key: string): string =>
	LLM_SLOT_LABELS[key]?.() ?? humanizeKey(key)

export const applyOf = (
	value: { apply?: ConfigApplyResult | null } | boolean | null | undefined,
): ConfigApplyResult | null =>
	value && typeof value === "object" ? (value.apply ?? null) : null

export const applyNeedsAttention = (apply: ConfigApplyResult): boolean =>
	apply.result !== "live" && apply.result !== "reloaded"

export const summarizeApply = (apply: ConfigApplyResult): string => {
	if (apply.result === "restart") return m.apply_restarting()

	const reloaded = apply.subsystems
		.filter((s) => s.status === "reloaded")
		.map((s) => subsystemLabel(s.subsystem))
	const reverted = apply.subsystems.filter((s) => s.status === "reverted")
	const failed = apply.subsystems.filter((s) => s.status === "failed")
	const sections = apply.revertedSections ?? []
	const reconciled = apply.reconciled ?? []

	const reloadedText = reloaded.length
		? m.apply_reloaded_suffix({ list: reloaded.join(", ") })
		: ""
	const sectionsText = sections.length
		? m.apply_reverted_sections({ list: sections.join(", ") })
		: ""
	const reconciledText = reconciled.length
		? m.apply_reconciled({ list: reconciled.map(subsystemLabel).join(", ") })
		: ""

	const join = (...parts: string[]): string =>
		parts.filter(Boolean).join(" ").trim()

	if (failed.length > 0) {
		const failedText = failed
			.map((s) =>
				m.apply_failed_item({
					name: subsystemLabel(s.subsystem),
					rev: s.runningRevision ?? "?",
				}),
			)
			.join(", ")
		return join(`${failedText}.`, sectionsText, reconciledText, reloadedText)
	}

	if (reverted.length > 0 || apply.result === "reverted") {
		const items = reverted
			.map((s) =>
				m.apply_reverted_item({
					name: subsystemLabel(s.subsystem),
					rev: s.runningRevision ?? "?",
				}),
			)
			.join(", ")
		if (!items)
			return join(
				m.apply_reverted({ list: sections.join(", ") }),
				reconciledText,
				reloadedText,
			)
		return join(
			m.apply_reverted({ list: items }),
			sectionsText,
			reconciledText,
			reloadedText,
		)
	}

	if (reloaded.length > 0)
		return join(
			m.apply_reloaded_live({ list: reloaded.join(", ") }),
			reconciledText,
		)

	return join(m.apply_live_no_restart(), reconciledText)
}

const hashText = (text: string): string => {
	let hash = 5381
	for (let i = 0; i < text.length; i += 1)
		hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0
	return (hash >>> 0).toString(36)
}

export const configDraftKey = (
	config: ConfigSnapshot,
	apply: ConfigApplyState | null,
): string => {
	const revision = Math.max(
		0,
		...(apply?.subsystems ?? []).map((s) => s.desiredRevision),
	)
	return `${revision}:${hashText(JSON.stringify(config))}`
}
