import type { Dispatch, ReactNode, SetStateAction } from "react"
import type { LucideIcon } from "lucide-react"
import type { ActionResult } from "@/types"
import type { FastPathSlot } from "@/types/routines"
import type {
	DescriptorLimitsView,
	SkillToolOptions,
	SkillToolPolicy,
	SkillTrustTier,
} from "@/types/skills"

export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue }

export type JsonObject = Record<string, JsonValue>

export type ConfigSection = JsonObject | null

export type DelegationCapability = "record" | "stt" | "llm" | "tts" | "playback"

export type CapabilityDelegation = {
	capability: DelegationCapability
	delegateToDomiaKey: string
	delegateToDomiaId: string | null
	priority: number
}

export type ConfigSnapshot = {
	domia: JsonObject
	character: ConfigSection
	emotion: ConfigSection
	modules: ConfigSection
	capabilities: ConfigSection
	stt: ConfigSection
	tts: ConfigSection
	llm: ConfigSection
	wakeWord: ConfigSection
	playback: ConfigSection
	mqttLocal: ConfigSection
	skillProviders: JsonObject[]
	delegations: CapabilityDelegation[]
}

export type ConfigFetchSource = "live" | "snapshot"

export type ConfigApplySubsystemId =
	| "stt-pool"
	| "tts-pool"
	| "llm"
	| "voice-listener"
	| "mqtt"
	| "skills"
	| "satellites"
	| "identity"
	| "proactivity"
	| "voice-feel"

export type ConfigApplySubsystemStatus =
	| "live"
	| "reloaded"
	| "failed"
	| "reverted"
	| "skipped"

export type ConfigApplySubsystem = {
	subsystem: string
	status: ConfigApplySubsystemStatus
	desiredRevision?: number
	runningRevision?: number
	error?: string
}

export type ConfigApplyResult = {
	result: "live" | "reloaded" | "partial" | "reverted" | "restart"
	desiredRevision: number
	subsystems: ConfigApplySubsystem[]
	drained: string[]
	revertedSections?: string[]
	reconciled?: ConfigApplySubsystemId[]
}

export type SubsystemRevisionState = {
	subsystem: ConfigApplySubsystemId
	desiredRevision: number
	runningRevision: number
	inSync: boolean
	lastError: string | null
	lastErrorAt: string | null
}

export type ConfigApplyState = {
	domiaKey: string
	inSync: boolean
	pending: ConfigApplySubsystemId[]
	subsystems: SubsystemRevisionState[]
}

export type ConfigImportResult = {
	config: ConfigSnapshot
	apply?: ConfigApplyResult
	state?: ConfigApplyState
}

export type ConfigHealthEntry = {
	stage: string
	engine: string | null
	configured: string | null
	path: string | null
	status: "ok" | "missing" | "unknown"
	detail?: string
}

export type ConfigHealth = {
	ok: boolean
	entries: ConfigHealthEntry[]
	llmSlots?: Record<string, number>
}

export type ConfigFieldKind =
	| "text"
	| "number"
	| "slider"
	| "boolean"
	| "select"
	| "model"
	| "tags"
	| "json"
	| "secret"

export type ConfigSchemaFieldType =
	| "boolean"
	| "number"
	| "string"
	| "enum"
	| "json"

export type ConfigSchemaField = {
	key: string
	column: string
	type: ConfigSchemaFieldType
	default: JsonValue
	enumValues?: string[]
	nullable: boolean
	secret?: boolean
}

export type ConfigSchemaSection = {
	id: string
	table: string
	fields: ConfigSchemaField[]
}

export type ConfigSchema = {
	sections: ConfigSchemaSection[]
	scalarSectionsOnly?: boolean
}

export type ConfigSchemaResult = {
	schema: ConfigSchema
	source: ConfigFetchSource
}

export type ConfigOptionLabels = Record<string, () => string>

export type BoundedIntRule = {
	min: number
	max: number
	unit?: string
}

export type ConfigField = {
	key: string
	label: () => string
	kind: ConfigFieldKind
	options?: readonly string[]
	optionLabels?: ConfigOptionLabels
	min?: number
	max?: number
	step?: number
	unit?: string
	stage?: string
	hint?: () => string
	advanced?: boolean
	readOnly?: boolean
	nullable?: boolean
	default?: JsonValue
	schemaType?: ConfigSchemaFieldType
}

export type ConfigFieldMeta = {
	label?: () => string
	hint?: () => string
	kind?: Exclude<ConfigFieldKind, "secret">
	options?: readonly string[]
	optionLabels?: ConfigOptionLabels
	min?: number
	max?: number
	step?: number
	unit?: string
	stage?: string
	advanced?: boolean
	readOnly?: boolean
}

export type ConfigFieldMetaEntry = ConfigFieldMeta & { key: string }

export type ConfigSectionFieldMeta = {
	primary: ConfigFieldMetaEntry[]
	advanced: ConfigFieldMetaEntry[]
}

export type ConfigSectionMeta = {
	id: string
	label: () => string
	icon: string
	group: string
	kind: ConfigSectionKind
	source?: string
	only?: readonly string[]
	description?: () => string
}

export type ConfigSectionKind = "fields" | "diagnostics" | "models" | "skill"

export type SkillFinalizeMode = "agent_loop" | "template" | "async" | "deadline"

export type SkillFinalizeRule = {
	mode: SkillFinalizeMode
	ack?: string
	error?: string
	done?: string
	ackAfterMs?: number
}

export type SkillRoutingDescriptor = {
	aliases?: Record<string, string[]>
	toolExamples?: Record<string, string[]>
	toolLabels?: Record<string, string>
}

export type SkillToolHintMap = Record<string, Record<string, unknown>>

export type SkillArgNormalizeMap = Record<string, Record<string, unknown>>

export type SkillResilienceConfig = Record<string, unknown>

export type SkillFastPathIntent = {
	tool?: string
	templates?: string[]
	slots?: Record<string, FastPathSlot>
	requiredKeywords?: string[][]
	argDefaults?: Record<string, JsonValue>
	priority?: number
	allowBlockedTokens?: boolean
}

export type SkillFastPathBlock = {
	intents?: SkillFastPathIntent[]
	expansionRules?: Record<string, string>
}

export type SkillExecutionDescriptor = {
	coreTools?: string[]
	hiddenTools?: string[]
	toolPolicy?: Record<string, SkillToolPolicy>
	toolHints?: SkillToolHintMap
	paramAllow?: Record<string, string[]>
	argNormalize?: SkillArgNormalizeMap
	finalize?: Record<string, SkillFinalizeRule>
	genericWords?: string[]
	resilience?: SkillResilienceConfig
}

export type SkillDescriptorI18n = {
	aliases?: Record<string, string[]>
	toolExamples?: Record<string, string[]>
	finalize?: Record<string, SkillFinalizeRule>
	genericWords?: string[]
	fastPath?: SkillFastPathBlock
}

export type DomiaSkillDescriptor = {
	version: 1
	kind?: string
	description?: string
	routing?: SkillRoutingDescriptor
	execution?: SkillExecutionDescriptor
	fastPath?: SkillFastPathBlock
	i18n?: Record<string, SkillDescriptorI18n>
}

export type SkillProviderTransport = "http" | "sse" | "stdio"

export type SkillProviderDraft = {
	id: string
	name: string
	protocol: "mcp" | "http" | "mqtt" | "builtin"
	type: SkillProviderTransport
	url: string
	authKind: "none" | "bearer" | "headers"
	token: string
	headers: string
	whitelist: string[]
	config: string
	trustTier: SkillTrustTier
	descriptor?: DomiaSkillDescriptor
	serverDescriptor?: DomiaSkillDescriptor
	serverDescriptorHash?: string | null
}

export type ConfigSectionDef = {
	id: string
	label: () => string
	icon: string
	group: string
	kind: ConfigSectionKind
	source?: string
	description?: () => string
	fields: ConfigField[]
}

export type ArchetypePreset = {
	id: string
	label: () => string
	description: () => string
	capabilities: Record<string, boolean>
}

export type SkillPreset = {
	id: string
	labelKey: () => string
	descriptionKey: () => string
	hintKey?: () => string
	icon?: LucideIcon
	draft: Partial<SkillProviderDraft>
}

export type ImportConfigInput = {
	domiaKey: string
	bundle: Record<string, unknown>
}

export type InstalledModel = {
	name: string
	kind: "dir" | "file" | "ollama"
	sizeBytes: number | null
}

export type ModelCatalogEntry = {
	kind: "sherpa-archive" | "file" | "ollama"
	label?: string
	stage?: string
	license?: string
	url?: string
	subdir?: string
	target?: string
	sourceDir?: string
	model?: string
}

export type ModelsReport = {
	modelsDir: string
	installed: InstalledModel[]
	catalog: ModelCatalogEntry[]
}

export type ModelJob = {
	id: string
	spec?: ModelCatalogEntry
	status: "running" | "done" | "error"
	detail: string
	startedAt?: number
	finishedAt?: number | null
}

export type ConfigResult = {
	config: ConfigSnapshot
	apply?: ConfigApplyState
}

export type ConfigFetchResult = ActionResult<ConfigSnapshot> & {
	source?: ConfigFetchSource
	applyState?: ConfigApplyState | null
}

export type ConfigHealthResult = {
	health: ConfigHealth
}

export type ModelsResult = {
	models: ModelsReport
}

export type ModelJobResult = {
	job: ModelJob
}

export type InstallModelInput = {
	domiaKey: string
	spec: Record<string, unknown>
}

export type FieldValue = string | number | boolean | string[]

export type ConfigDraft = Record<string, Record<string, FieldValue>>

export type SectionImpact = {
	section: string
	label: string
	changed: string[]
}

export type DraftImpact = {
	totalChanged: number
	sections: SectionImpact[]
}

export type ConfigDraftApi = {
	draft: ConfigDraft
	setField: (sectionId: string, key: string, value: FieldValue) => void
	setSectionValues: (
		sectionId: string,
		values: Record<string, FieldValue>,
	) => void
	changedKeys: (sectionId: string) => string[]
	impact: DraftImpact
	errors: Record<string, Record<string, string>>
	isValid: boolean
	fieldError: (sectionId: string, key: string) => string | null
	buildBundle: () => Record<string, unknown>
	mergeInto: (base: ConfigSnapshot) => ConfigSnapshot
	reset: () => void
	commit: () => void
	skillProviders: SkillProviderDraft[]
	setSkillProviders: Dispatch<SetStateAction<SkillProviderDraft[]>>
	skillChanged: boolean
	delegations: CapabilityDelegation[]
	setDelegations: Dispatch<SetStateAction<CapabilityDelegation[]>>
	delegationsChanged: boolean
}

export type ConfigWorkspaceMode = "live" | "template"

export type ConfigWorkspaceTemplateRef = {
	id: string
	name: string
	description: string
}

export type ConfigWorkspaceProps = {
	domiaKey: string
	domiaName: string
	config: ConfigSnapshot
	online: boolean
	mode?: ConfigWorkspaceMode
	onSaved?: () => void
	editTemplate?: ConfigWorkspaceTemplateRef
	readOnly?: boolean
	applyState?: ConfigApplyState | null
}

export type ListInputProps = {
	value: string[]
	onChange: (v: string[]) => void
	multiline?: boolean
	maxItems?: number
	id?: string
	className?: string
	placeholder?: string
	rows?: number
	"aria-label"?: string
}

export type KeyedRow<T> = [string, T]

export type KeyedRowsState<T> = {
	key: string
	rows: KeyedRow<T>[]
}

export type DescriptorFieldProps = {
	label: string
	hint?: string
	children: ReactNode
}

export type KeyValueListFieldProps = {
	label: string
	addLabel: string
	rows: KeyedRow<string[]>[]
	onChange: (rows: KeyedRow<string[]>[]) => void
	keyLabel: string
	valuesLabel: string
	keyPlaceholder?: string
}

export type KeyValueMapFieldProps = Omit<
	KeyValueListFieldProps,
	"rows" | "onChange"
> & {
	value?: Record<string, string[]>
	onChange: (v: Record<string, string[]>) => void
}

export type KeyTextMapFieldProps = {
	label: string
	addLabel: string
	value?: Record<string, string>
	onChange: (v: Record<string, string>) => void
	keyLabel: string
	valueLabel: string
	hint?: string
}

export type StringListFieldProps = {
	label: string
	value?: string[]
	onChange: (v: string[]) => void
	multiline?: boolean
	placeholder?: string
}

export type KeyEnumMapFieldProps = {
	label: string
	addLabel: string
	value?: Record<string, SkillToolPolicy>
	onChange: (v: Record<string, SkillToolPolicy>) => void
	keyLabel: string
}

export type FinalizeFieldProps = {
	value?: Record<string, SkillFinalizeRule>
	onChange: (v: Record<string, SkillFinalizeRule>) => void
}

export type LocaleOverridesProps = {
	locale: string
	value?: SkillDescriptorI18n
	options: SkillToolOptions
	onChange: (v: SkillDescriptorI18n) => void
}

export type DescriptorChecksProps = {
	value: DomiaSkillDescriptor
	limits: DescriptorLimitsView
}

export type ConfigSkillDescriptorProps = {
	value?: DomiaSkillDescriptor
	onChange: (d: DomiaSkillDescriptor) => void
	options: SkillToolOptions
	limits: DescriptorLimitsView
	kindLocked?: boolean
}

export type ToolChecklistProps = {
	label: string
	hint?: string
	note?: string
	value: string[]
	onChange: (v: string[]) => void
	options: SkillToolOptions
	placeholder: string
}

export type KeywordGroupsProps = {
	groups: string[][]
	onChange: (v: string[][]) => void
}

export type ExpansionRulesProps = {
	rules: Record<string, string>
	onChange: (v: Record<string, string>) => void
}

export type IntentEditorProps = {
	index: number
	intent: SkillFastPathIntent
	options: SkillToolOptions
	onChange: (v: SkillFastPathIntent) => void
	onRemove: () => void
}

export type ConfigFastPathProps = {
	scope: string
	value?: SkillFastPathBlock
	options: SkillToolOptions
	onChange: (v: SkillFastPathBlock) => void
}

export type ServerDescriptorPanelProps = {
	descriptor?: DomiaSkillDescriptor
	hash?: string | null
}

export type ConfigSkillProvidersProps = {
	draft: ConfigDraftApi
	domiaKey: string
}

export type DuplicateKeyIssueProps = {
	rows: KeyedRow<unknown>[]
}

export type KeyedRowsCodec<T, R> = {
	toRows: (value: Record<string, T>) => KeyedRow<R>[]
	fromRows: (rows: KeyedRow<R>[]) => Record<string, T>
}
