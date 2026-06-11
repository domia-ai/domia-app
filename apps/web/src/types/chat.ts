import type { DomiaRegistryRow } from "@domia-app/db"
import type { RunTimings } from "@/types/conversations"

export type ChatTurnRole = "user" | "domia"

export type ChatTurnKind = "text" | "voice"

export type ChatTurn = {
	id: string
	role: ChatTurnRole
	kind: ChatTurnKind
	text: string
	at: string
	pending?: boolean
	error?: boolean
	interactionId?: string | null
	transcript?: string | null
	audioUrl?: string | null
	timings?: RunTimings | null
	spoken?: boolean
}

export type SendMessageInput = {
	targetDomiaKey: string
	kind: ChatTurnKind
	text?: string
	audioBase64?: string
	speak: boolean
}

export type ChatExchangeResult = {
	interactionId: string | null
	transcript: string | null
	reply: string
	audioUrl: string | null
	timings: RunTimings | null
}

export type ChatConsoleProps = {
	domias: DomiaRegistryRow[]
	initialKey: string
}

export type ComposerProps = {
	disabled: boolean
	onSendText: (text: string, speak: boolean) => void
	onSendVoice: (audioBase64: string, fileName: string, speak: boolean) => void
}

export type TurnBubbleProps = {
	turn: ChatTurn
	domiaKey: string
	domiaName: string
	domiaAvatarId: string | null
}
