import type { LucideIcon } from "lucide-react"
import type { LinkProps } from "@tanstack/react-router"

export type {
	DomiaRole,
	FleetTelemetry,
	FleetRow,
	FleetStatsFull,
	DomiaTelemetry,
	RecentInteraction,
	OverviewPerformance,
	OverviewData,
	DomiaPerformance,
} from "@/types/fleet"

export type {
	ChatTurn,
	ChatTurnRole,
	ChatTurnKind,
	SendMessageInput,
	ChatExchangeResult,
	ChatConsoleProps,
	ComposerProps,
	TurnBubbleProps,
} from "@/types/chat"

export type {
	MindCharacter,
	MindModules,
	MindSnapshot,
	MindEmotion,
	AppTemplate,
	ApplyTemplateInput,
	TemplateCardProps,
	CharacterEnumKey,
	CharacterTagKey,
	EmotionKey,
} from "@/types/mind"

export type ActionResult<T = void> =
	| { ok: true; data?: T }
	| { ok: false; error: string }

export type FleetStats = {
	total: number
	online: number
	active: number
}

export type OverviewStats = {
	discovered: number
	online: number
	offline: number
	activeSessions: number
	conversationsAllTime: number
}

export type MeshEdge = {
	source: string
	target: string
	capability: string
}

export type NavItem = {
	href: LinkProps["to"]
	label: string
	icon: LucideIcon
	soon?: boolean
	activeFor?: string[]
}

export type RuntimeCapabilities = {
	wakeword: boolean
	record: boolean
	stt: boolean
	llm: boolean
	tts: boolean
	playback: boolean
	intentDetection: boolean
	intentExecution: boolean
	promptGeneration: boolean
}

export type CapabilityKey = keyof RuntimeCapabilities

export type EmotionState = {
	joy: number
	sadness: number
	anger: number
	fear: number
	trust: number
	disgust: number
	anticipation: number
	surprise: number
}

export type MoodRadarProps = {
	emotion: EmotionState
	accent: string
}

export type WaveformProps = {
	src: string
	accent?: "primary" | "input"
	height?: number
	showSpeed?: boolean
	autoPlay?: boolean
	className?: string
	onReady?: (duration: number) => void
	onFinish?: () => void
	onProgress?: (currentTime: number) => void
}

export type WaveformHandle = {
	play: () => void
	pause: () => void
	restart: () => void
}

export type CommandDomiaItem = {
	domiaKey: string
	name: string
}

export type CommandConversationItem = {
	id: string
	input: string
	reply: string | null
	domia: string
}

export type CommandPaletteData = {
	domias: CommandDomiaItem[]
	conversations: CommandConversationItem[]
}

export type CharacterProfile = {
	name: string
	personality: string
	profession: string
	communicationStyle: string
	perceivedAge: string
	language: string
	languagesSpoken: string[]
	culturalBackground: string
	knowledgeDepth: string
	interests: string[]
	hobbies: string[]
	skills: string[]
	relationshipType: string
	roleMode: string
}

export type ModuleSettings = {
	emotionEngine: boolean
	emotionCapture: boolean
	memoryEngine: boolean
	factCapture: boolean
	factRecall: boolean
	reflectionOnlyWhenIdle: boolean
	reflectionConcurrency: number
	collectiveMind: boolean
	narrativeEngine: boolean
	identityEngine: boolean
	remoteAccessEngine: boolean
}

export type LlmModelConfig = {
	engine: string
	modelName: string
	baseUrl: string
	apiKey: string | null
	temperature: number
	contextWindow: number
	numPredict: number
	llmConcurrency: number
}

export type TtsConfig = {
	engine: string
	voiceName: string
	language: string
	speed: number
}

export type SttConfig = {
	engine: string
	modelName: string
	language: string
}

export type WakeWordConfig = {
	engine: string
	wakeWord: string
	framework: string
}

export type CapabilityDelegation = {
	capability: string
	targetDomiaKey: string
}

export type SkillProviderConfig = {
	name: string
	enabled?: boolean
}

export type DomiaConfig = {
	characterProfile: CharacterProfile | null
	emotionState: EmotionState | null
	runtimeCapabilities: RuntimeCapabilities | null
	moduleSettings: ModuleSettings | null
	llmModelConfig: LlmModelConfig | null
	ttsConfig: TtsConfig | null
	sttConfig: SttConfig | null
	wakeWordConfig: WakeWordConfig | null
	capabilityDelegations: CapabilityDelegation[]
	skillProviders: SkillProviderConfig[]
}
