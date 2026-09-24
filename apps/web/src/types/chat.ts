import type { MeshDomiaRow } from "@/types/fleet"
import type { RunTimings } from "@/types/conversations"

export type ChatTurnRole = "user" | "domia" | "system"

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
	satelliteId?: string
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
	domiaKey?: string
	onSendText: (text: string, speak: boolean, satelliteId?: string) => void
	onSendVoice: (
		audioBase64: string,
		fileName: string,
		speak: boolean,
		satelliteId?: string,
	) => void
}

export type TurnBubbleProps = {
	turn: ChatTurn
	domiaKey: string
	domiaName: string
	domiaAvatarId: string | null
	stream?: ChatStreamState | null
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

export type UseLiveVoiceReturn = {
	state: LiveVoiceState
	connect: () => Promise<void>
	disconnect: () => void
	connected: boolean
}

export type LiveVoiceProps = {
	target: LiveVoiceTarget
	domiaName: string
	disabled?: boolean
}

export type ChatStreamRequestBody = {
	domiaKey: string
	text: string
	satelliteId?: string
}

export type ChatStreamStatus = "idle" | "streaming" | "done" | "error"

export type ChatStreamStep = {
	id: string
	name: string
	status: "ok" | "failed" | null
	elapsedMs: number | null
}

export type ChatStreamTool = {
	id: string
	name: string
	provider: string | null
	status: string | null
	toolMs: number | null
}

export type ChatStreamState = {
	status: ChatStreamStatus
	runId: string | null
	steps: ChatStreamStep[]
	tools: ChatStreamTool[]
	text: string
	error: string | null
}

export type ChatStreamInput = {
	domiaKey: string
	text: string
	satelliteId?: string
}

export type ChatStreamResult = {
	ok: boolean
	runId: string | null
	text: string
	error: string | null
	started: boolean
}

export type UseChatStreamReturn = {
	state: ChatStreamState
	start: (input: ChatStreamInput) => Promise<ChatStreamResult>
	stop: () => void
	reset: () => void
}

export type StreamStripProps = {
	state: ChatStreamState
}
