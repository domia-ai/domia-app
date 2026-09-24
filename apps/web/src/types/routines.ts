import type { JsonValue } from "@/types/config"

export type FastPathMapValue = {
	in: string[]
	out: JsonValue
}

export type FastPathSlotSource =
	| { kind: "context"; key: string }
	| { kind: "enum"; values: string[] }
	| { kind: "map"; values: FastPathMapValue[] }
	| { kind: "schemaEnum"; arg: string }
	| { kind: "range"; min: number; max: number }
	| { kind: "duration"; maxSeconds?: number }
	| { kind: "clockTime" }

export type FastPathSlotKind = FastPathSlotSource["kind"]

export type FastPathSlot = {
	source: FastPathSlotSource
	arg?: string
}

export type RoutineStep = {
	tool: string
	args: Record<string, JsonValue>
}

export type Routine = {
	id: string
	domiaId: string
	slug: string
	name: string
	description: string
	isActive: boolean
	phrases: Record<string, string[]>
	slots: Record<string, FastPathSlot> | null
	steps: RoutineStep[]
	reply: Record<string, string>
	createdAt: string
	updatedAt: string
}

export type RoutineInput = {
	id?: string
	slug: string
	name: string
	description: string
	isActive?: boolean
	phrases: Record<string, string[]>
	slots?: Record<string, FastPathSlot> | null
	steps: RoutineStep[]
	reply: Record<string, string>
}

export type RoutinesResult = {
	routines: Routine[]
}

export type SaveRoutineResult = {
	routine: Routine
	created: boolean
}

export type DeleteRoutineResult = {
	deleted: true
	id: string
}

export type FastPathMatch = {
	tool: string
	namespacedName: string
	providerSlug: string
	args: Record<string, JsonValue>
	resolvedArgs: Record<string, JsonValue>
	literalChars: number
	slotChars: number
	coverage: number
	priority: number
	template: string
}

export type FastPathMissReason =
	| "disabled"
	| "no_index"
	| "too_long"
	| "blocked_token"
	| "no_match"
	| "ambiguous"
	| "unavailable"

export type FastPathVerdict =
	| { kind: "match"; match: FastPathMatch; fastPathMs: number }
	| { kind: "compound"; matches: FastPathMatch[]; fastPathMs: number }
	| { kind: "miss"; reason: FastPathMissReason; fastPathMs: number }

export type FastPathTryResult = {
	verdict: FastPathVerdict
}

export type RoutineDraft = {
	id?: string
	slug: string
	name: string
	description: string
	isActive: boolean
	phrases: Record<string, string[]>
	reply: Record<string, string>
	slots: [string, FastPathSlot][]
	steps: RoutineDraftStep[]
}

export type RoutineToolOption = {
	rawName: string
	displayName: string
	policy: string | null
}

export type RoutineToolGroup = {
	providerId: string
	providerName: string
	tools: RoutineToolOption[]
}

export type RoutineArgRow = [string, string[]]

export type RoutineDraftStep = {
	tool: string
	args: RoutineArgRow[]
}

export type RoutinePhrasesProps = {
	phrases: Record<string, string[]>
	reply: Record<string, string>
	onPhrases: (v: Record<string, string[]>) => void
	onReply: (v: Record<string, string>) => void
}

export type MapValuesProps = {
	values: FastPathMapValue[]
	onChange: (v: FastPathMapValue[]) => void
}

export type SourceFieldsProps = {
	source: FastPathSlotSource
	onChange: (v: FastPathSlotSource) => void
}

export type RoutineSlotsProps = {
	slots: [string, FastPathSlot][]
	onChange: (v: [string, FastPathSlot][]) => void
}

export type RoutineStepsProps = {
	domiaKey: string
	steps: RoutineDraftStep[]
	slotArgs: string[]
	onChange: (v: RoutineDraftStep[]) => void
}

export type RoutineEditorProps = {
	domiaKey: string
	draft: RoutineDraft
	online: boolean
	saving: boolean
	onChange: (draft: RoutineDraft) => void
	onSave: () => void
	onCancel: () => void
}

export type MatchCardProps = {
	match: FastPathMatch
	expectedTool: string
}

export type RoutineTryProps = {
	domiaKey: string
	expectedTool: string
	disabled: boolean
}

export type RoutinesManagerProps = {
	domiaKey: string
	online: boolean
}
