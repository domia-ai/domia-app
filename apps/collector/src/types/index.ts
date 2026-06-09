import type { z } from "zod"
import type {
	InteractionTraceRow,
	InteractionSessionTraceRow,
	EmotionEventRow,
	MemoryFactRow,
} from "@domia-app/db"
import type { domiaSnapshotSchema } from "@/schemas"

export type DomiaSnapshot = z.infer<typeof domiaSnapshotSchema>

export type NodeInteraction = Omit<InteractionTraceRow, "sourceDomiaKey">
export type NodeSession = Omit<InteractionSessionTraceRow, "sourceDomiaKey">
export type NodeEmotionEvent = Omit<EmotionEventRow, "sourceDomiaKey">
export type NodeFact = Omit<MemoryFactRow, "sourceDomiaKey">

export type SyncResponse = {
	interactions: NodeInteraction[]
	sessions: NodeSession[]
	emotionEvents: NodeEmotionEvent[]
	facts: NodeFact[]
	nextCursor: string
}

export type AudioKind = "input" | "tts"
