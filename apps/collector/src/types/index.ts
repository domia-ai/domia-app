import type { Column } from "drizzle-orm"
import type { z } from "zod"
import type {
	InteractionTraceRow,
	InteractionSessionTraceRow,
	EmotionEventRow,
	MemoryFactRow,
	AnnouncementRow,
	TurnEventRow,
	ToolRunRow,
	MemoryEpisodeRow,
	UserModelRow,
	KnowledgeEntryRow,
	VoiceFeelAdjustmentRow,
	FactEvidenceRow,
} from "@domia-app/db"
import type { domiaSnapshotSchema } from "@/schemas"

export type DomiaSnapshot = z.infer<typeof domiaSnapshotSchema>

export type NodeInteraction = Omit<InteractionTraceRow, "sourceDomiaKey">
export type NodeSession = Omit<InteractionSessionTraceRow, "sourceDomiaKey">
export type NodeEmotionEvent = Omit<EmotionEventRow, "sourceDomiaKey">
export type NodeFact = Omit<MemoryFactRow, "sourceDomiaKey">
export type NodeAnnouncement = Omit<AnnouncementRow, "sourceDomiaKey">
export type NodeTurnEvent = Omit<TurnEventRow, "sourceDomiaKey">
export type NodeToolRun = Omit<ToolRunRow, "sourceDomiaKey">
export type NodeMemoryEpisode = Omit<MemoryEpisodeRow, "sourceDomiaKey">
export type NodeUserModel = Omit<UserModelRow, "sourceDomiaKey">
export type NodeKnowledgeEntry = Omit<KnowledgeEntryRow, "sourceDomiaKey">
export type NodeVoiceFeelAdjustment = Omit<
	VoiceFeelAdjustmentRow,
	"sourceDomiaKey"
>
export type NodeFactEvidence = Omit<FactEvidenceRow, "sourceDomiaKey">

export type SyncResponse = {
	interactions: NodeInteraction[]
	sessions: NodeSession[]
	emotionEvents: NodeEmotionEvent[]
	facts: NodeFact[]
	announcements: NodeAnnouncement[]
	turnEvents: NodeTurnEvent[]
	toolRuns: NodeToolRun[]
	memoryEpisodes: NodeMemoryEpisode[]
	knowledgeEntries: NodeKnowledgeEntry[]
	voiceFeelAdjustments: NodeVoiceFeelAdjustment[]
	factEvidence: NodeFactEvidence[]
	userModel: NodeUserModel | null
	nextCursor: string
	nextTurnCursor: TurnCursor | null
	nextFactsCursor: TurnCursor | null
	nextToolCursor: TurnCursor | null
	nextEpisodeCursor: TurnCursor | null
	nextKnowledgeCursor: TurnCursor | null
	nextVoiceFeelCursor: TurnCursor | null
	nextEvidenceCursor: TurnCursor | null
}

export type AudioKind = "input" | "tts" | "announce"

export type TurnCursor = {
	since: string
	id: string
}

export type SyncKeysetStream =
	| "turn"
	| "facts"
	| "tool"
	| "episode"
	| "knowledge"
	| "voiceFeel"
	| "evidence"

export type SyncCursors = { interaction: string } & Record<
	SyncKeysetStream,
	TurnCursor
>

export type SyncStreamDescriptor = {
	stream: SyncKeysetStream
	rows: (data: SyncResponse) => number
	next: (data: SyncResponse) => TurnCursor | null
}

export type MirrorColumn = [name: string, column: Column]

export type RetryOptions = {
	attempts?: number
	baseDelayMs?: number
}

export type NodeGroup = {
	localIp: string
	httpPort: number
	httpScheme: string
	keys: string[]
}
