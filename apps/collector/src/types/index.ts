import type { z } from "zod"
import type {
	InteractionTraceRow,
	InteractionSessionTraceRow,
	EmotionEventRow,
	MemoryFactRow,
	AnnouncementRow,
	TurnEventRow,
} from "@domia-app/db"
import type { domiaSnapshotSchema } from "@/schemas"

export type DomiaSnapshot = z.infer<typeof domiaSnapshotSchema>

export type NodeInteraction = Omit<InteractionTraceRow, "sourceDomiaKey">
export type NodeSession = Omit<InteractionSessionTraceRow, "sourceDomiaKey">
export type NodeEmotionEvent = Omit<EmotionEventRow, "sourceDomiaKey">
export type NodeFact = Omit<MemoryFactRow, "sourceDomiaKey">
export type NodeAnnouncement = Omit<AnnouncementRow, "sourceDomiaKey">
export type NodeTurnEvent = Omit<TurnEventRow, "sourceDomiaKey">

export type SyncResponse = {
	interactions: NodeInteraction[]
	sessions: NodeSession[]
	emotionEvents: NodeEmotionEvent[]
	facts: NodeFact[]
	announcements: NodeAnnouncement[]
	turnEvents: NodeTurnEvent[]
	nextCursor: string
	nextTurnCursor: TurnCursor | null
}

export type AudioKind = "input" | "tts" | "announce"

export type TurnCursor = {
	since: string
	id: string
}

export type RetryOptions = {
	attempts?: number
	baseDelayMs?: number
}
