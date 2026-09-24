import type { VoiceFeelFeatures } from "@domia-app/db"
import type { ConfigApplyResult } from "@/types/config"

export type { VoiceFeelFeatures }

export type VoiceFeelSettings = {
	enabled: boolean
	windowTurns: number
	minTurns: number
	dailyBudget: number
	cooldownMs: number
}

export type VoiceFeelAdjustment = {
	id: string
	ruleId: string
	section: string
	field: string
	from: number
	to: number
	sampleSize: number
	confidence: number
	configRevision: number | null
	createdAt: string
	appliedAt: string | null
	revertedAt: string | null
}

export type VoiceFeelCooldown = {
	section: string
	field: string
	ruleId: string
	remainingMs: number
	until: string
}

export type VoiceFeelSnapshot = {
	enabled: boolean
	settings: VoiceFeelSettings
	features: VoiceFeelFeatures
	budgetUsedToday: number
	cooldowns: VoiceFeelCooldown[]
	adjustments: VoiceFeelAdjustment[]
}

export type VoiceFeelMutationResult = {
	adjustment: VoiceFeelAdjustment
	apply: ConfigApplyResult
}

export type PendingAction = {
	kind: "apply" | "revert"
	adjustment: VoiceFeelAdjustment
}

export type VoiceFeelActionInput = {
	domiaKey: string
	id: string
}
