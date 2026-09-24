import type {
	ConfirmationDecision,
	PendingConfirmation,
} from "@/types/confirmations"
import type { ProactivityStatusView } from "@/types/proactivity"
import type {
	PendingAction,
	VoiceFeelAdjustment,
	VoiceFeelFeatures,
	VoiceFeelSnapshot,
} from "@/types/voice-feel"

export type DangerZoneProps = {
	domiaKey: string
	domiaName: string
	online: boolean
}

export type RenameIdentityProps = {
	domiaKey: string
	domiaName: string
	online: boolean
}

export type KnowledgeManagerProps = {
	domiaKey: string
	online: boolean
	maxChars?: number
}

export type VoiceFeelCardProps = {
	domiaKey: string
	online: boolean
}

export type VoiceFeelFeatureGridProps = {
	features: VoiceFeelFeatures
}

export type VoiceFeelAdjustmentRowProps = {
	adjustment: VoiceFeelAdjustment
	busy: boolean
	online: boolean
	onAct: (action: PendingAction) => void
}

export type VoiceFeelBodyProps = {
	snapshot: VoiceFeelSnapshot
	busy: boolean
	online: boolean
	onAct: (action: PendingAction) => void
}

export type VoiceFeelConfirmDialogProps = {
	pending: PendingAction | null
	busy: boolean
	onCancel: () => void
	onConfirm: () => void
}

export type ConfirmationArgsInspectorProps = {
	entry: PendingConfirmation
}

export type ConfirmationRowProps = {
	entry: PendingConfirmation
	now: number
	busy: boolean
	disabled: boolean
	onSettle: (scope: string, decision: ConfirmationDecision) => void
}

export type AgendaRuntimeStripProps = {
	status: ProactivityStatusView
}
