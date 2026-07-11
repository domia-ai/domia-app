import type { MeshDomiaRow } from "@/types/fleet"
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
	autoplay?: boolean
	cancelled?: boolean
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
	domias: MeshDomiaRow[]
	initialKey: string
}

export type LiveVoiceStatus =
	| "idle"
	| "connecting"
	| "ready"
	| "listening"
	| "thinking"
	| "speaking"
	| "error"

export type LiveVoiceState = {
	status: LiveVoiceStatus
	transcript: string
	reply: string
	error: string | null
}

export type LiveVoiceTarget = {
	domiaKey: string
	localIp: string | null
	httpPort: number | null
}

export type AudioRecorderControls = {
	recording: boolean
	converting: boolean
	seconds: number
	level: number
	start: () => Promise<void>
	stop: () => void
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

export type RecordingIndicatorProps = {
	seconds: number
	level: number
	className?: string
}

export type LivePlaybackFormat = {
	sampleRate: number
	channels: number
}
