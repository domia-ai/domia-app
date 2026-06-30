export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue }

export type JsonObject = { [key: string]: JsonValue }

export type ConfigSection = JsonObject | null

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
	delegations: JsonObject[]
}

export type ConfigFetchSource = "live" | "snapshot"

export type ConfigApplySubsystemStatus =
	| "live"
	| "reloaded"
	| "failed"
	| "skipped"

export type ConfigApplySubsystem = {
	subsystem: string
	status: ConfigApplySubsystemStatus
	runningRevision?: number
	error?: string
}

export type ConfigApplyResult = {
	result: "live" | "reloaded" | "partial" | "restart"
	desiredRevision: number
	subsystems: ConfigApplySubsystem[]
	drained: string[]
}

export type ConfigImportResult = {
	config: ConfigSnapshot
	apply?: ConfigApplyResult
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
}

export type ConfigFieldKind =
	| "text"
	| "number"
	| "slider"
	| "boolean"
	| "select"
	| "model"
	| "tags"

export type ConfigField = {
	key: string
	label: string
	kind: ConfigFieldKind
	options?: readonly string[]
	min?: number
	max?: number
	step?: number
	unit?: string
	stage?: string
	hint?: string
}

export type ConfigSectionKind =
	| "fields"
	| "radar"
	| "diagnostics"
	| "models"
	| "skill"

export type SkillProviderDraft = {
	id: string
	name: string
	protocol: "mcp" | "http" | "mqtt"
	type: "http" | "sse"
	url: string
	authKind: "none" | "bearer" | "headers"
	token: string
	headers: string
	whitelist: string[]
	config: string
}

export type ConfigSectionDef = {
	id: string
	label: string
	icon: string
	group: string
	kind: ConfigSectionKind
	source?: string
	description?: string
	fields: ConfigField[]
}

export type ArchetypePreset = {
	id: string
	label: string
	description: string
	capabilities: Record<string, boolean>
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
	url?: string
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
	status: "running" | "done" | "error"
	detail: string
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
