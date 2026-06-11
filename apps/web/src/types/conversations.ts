import type { ReactNode } from "react"
import type { CharacterProfile, EmotionState, WaveformHandle } from "@/types"
import type { FilterFacetOption } from "@/types/table"
import type {
	AudioAssetRow,
	InteractionLabelRow,
	InteractionSessionTraceRow,
	InteractionTraceRow,
	MemoryFactRow,
} from "@domia-app/db"

export type AdjacentTurns = {
	prevId: string | null
	nextId: string | null
	index: number
	total: number
}

export type ConversationRow = InteractionTraceRow & {
	domiaName: string | null
	domiaAvatarId: string | null
	rating: string | null
	tags: string[] | null
	correction: string | null
}

export type FlowKey = "s2s" | "t2t" | "t2s" | "v2t"

export type FlowDef = {
	key: FlowKey
	label: string
	inputType: "VOICE" | "TEXT"
	responseType: "voice" | "text"
	className: string
}

export type ConversationPreset = {
	key: string
	label: string
	params: Record<string, string | null>
}

export type DomiaOption = { domiaKey: string; name: string | null }

export type ConversationExportRow = {
	id: string
	createdAt: string
	domia: string
	flow: FlowKey
	input: string | null
	response: string | null
	llmModel: string | null
	ttsVoice: string | null
	totalMs: number | null
	rating: string | null
	correction: string | null
	tags: string[] | null
}

export type SnapshotFacetOptions = {
	llmModel: FilterFacetOption[]
	sttModel: FilterFacetOption[]
	ttsEngine: FilterFacetOption[]
	ttsVoice: FilterFacetOption[]
}

export type ConversationFacets = SnapshotFacetOptions & {
	domiaOptions: FilterFacetOption[]
}

export type ConversationStats = {
	total: number
	avgMs: number | null
	errorRate: number
	ungraded: number
	flows: { key: FlowKey; count: number }[]
}

export type InlineAudioProps = {
	interactionId: string
	kind: "input" | "tts"
}

export type RowActionsProps = {
	row: ConversationRow
}

export type BulkActionsProps = {
	rows: ConversationRow[]
	onClear: () => void
	onGraded: () => void
}

export type InteractionDetail = {
	trace: InteractionTraceRow
	domiaName: string | null
	domiaAvatarId: string | null
	label: InteractionLabelRow | null
	inputAudio: AudioAssetRow | null
	ttsAudio: AudioAssetRow | null
	memoryFacts: MemoryFactRow[]
	adjacent: AdjacentTurns | null
}

export type ExecutionJourneyStep = {
	step: LatencyStepKey
	executorKey: string
	executorName: string
	local: boolean
}

export type MeshJourneyProps = {
	trace: InteractionTraceRow
	originKey: string
}

export type SessionDetail = {
	session: InteractionSessionTraceRow
	domiaName: string | null
	domiaAvatarId: string | null
	turns: InteractionTraceRow[]
}

export type ReplayPhase = "idle" | "input" | "processing" | "response" | "done"

export type ReplayCell = {
	className: string
	pct: number
	active: boolean
}

export type ReplayCardProps = {
	trace: InteractionTraceRow
	inputSrc: string | null
	ttsSrc: string | null
}

export type AudioPlayerProps = {
	src: string | null
	kind: "input" | "tts"
	bytes?: number | null
	engine?: string | null
}

export type GradingPanelProps = {
	interactionId: string
	initial: InteractionLabelRow | null
}

export type PipelineStepKey =
	| "wakeword"
	| "input"
	| "stt"
	| "mcp"
	| "llmPrompt"
	| "llmResponse"
	| "tts"

export type PipelineStep = {
	key: PipelineStepKey
	icon: ReactNode
	title: string
	body: ReactNode
	durationMs?: number
	executorName?: string
	delegated?: boolean
	model?: string | null
}

export type ReplayState = {
	phase: ReplayPhase
	activeStepKey: PipelineStepKey | null
	running: boolean
}

export type ReplayTrackKind = "input" | "tts"

export type ReplaySink = {
	onReady?: (kind: ReplayTrackKind, duration: number) => void
	onFinish?: (kind: ReplayTrackKind) => void
	onProgress?: (kind: ReplayTrackKind, time: number) => void
}

export type ReplayController = {
	registerTrack: (kind: ReplayTrackKind, handle: WaveformHandle | null) => void
	getTrack: (kind: ReplayTrackKind) => WaveformHandle | null
	emitReady: (kind: ReplayTrackKind, duration: number) => void
	emitFinish: (kind: ReplayTrackKind) => void
	emitProgress: (kind: ReplayTrackKind, time: number) => void
	setSink: (sink: ReplaySink) => void
}

export type LatencyStepKey = "stt" | "llm" | "tts"

export type LatencyStep = {
	key: LatencyStepKey
	label: string
	ms: number
	pct: number
}

export type LatencyBreakdown = {
	steps: LatencyStep[]
	totalMs: number
	ttfaMs: number | null
	delegated: boolean
}

export type UserMoodSnapshot = {
	primary?: string
	note?: string
}

export type DomiaSnapshot = {
	emotion: EmotionState | null
	character: CharacterProfile | null
	stt: { engine?: string; modelName?: string } | null
	llm: { engine?: string; modelName?: string } | null
	tts: {
		engine?: string
		voiceName?: string
		speed?: number
		pitch?: number
		silenceScale?: number
	} | null
	wakeWord: { engine?: string; wakeWord?: string; model?: string } | null
	modules: Record<string, unknown> | null
	capabilities: Record<string, unknown> | null
}

export type RunMode = "text" | "voice" | "transcript-as-voice"

export type RunTarget = {
	domiaKey: string
	name: string
	localIp: string
	httpPort: number
	isOrigin: boolean
	online: boolean
}

export type RunTimings = {
	sttMs: number
	llmMs: number
	ttsMs: number
	ttfaMs: number
	totalMs: number
}

export type RunInteractionInput = {
	sourceInteractionId: string
	targetDomiaKey: string
	mode: RunMode
}

export type RunInteractionResult = {
	reply: string
	transcript: string | null
	timings: RunTimings | null
	newInteractionId: string | null
	audioUrl: string | null
	audioBase: string
}

export type NodeChatBody = { text: string; speak?: boolean }
export type NodeChatResponse = {
	interactionId: string
	reply: string
	audioUrl?: string | null
	timings?: RunTimings
}
export type NodeVoiceBody = { audioBase64: string; speak?: boolean }
export type NodeVoiceResponse = {
	interactionId: string
	transcript: string
	reply: string
	audioUrl: string | null
	timings: RunTimings
}

export type RunAgainPanelProps = {
	sourceInteractionId: string
	originKey: string
	targets: RunTarget[]
	originalReply: string | null
	originalTrace: InteractionTraceRow
}

export type GradeInput = {
	interactionId: string
	rating: "up" | "down" | null
	correction: string | null
	tags: string[] | null
}

export type BulkGradeInput = {
	ids: string[]
	rating: "up" | "down"
}

export type PersonaStateCardProps = {
	trace: InteractionTraceRow
}

export type FactsCardProps = {
	facts: MemoryFactRow[]
}

export type SessionNavProps = {
	adjacent: AdjacentTurns
	sessionId: string
}

export type RawTraceProps = {
	trace: InteractionTraceRow
}

export type CollapsiblePromptProps = {
	text: string
	collapsedLines?: number
}

export type CopyButtonProps = {
	text: string
	label?: string
}
