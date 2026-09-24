export type ToolRunRecord = {
	id: string
	interactionId: string
	tool: string
	providerSlug: string | null
	routineSlug: string | null
	stepIndex: number | null
	argsHash: string | null
	riskClass: string | null
	policyDecision: string | null
	policySource: string | null
	confirmationId: string | null
	status: string | null
	durationMs: number | null
	spokenAt: string | null
	settledAt: string | null
	createdAt: string
}

export type ToolRunGroup = {
	key: string
	routineSlug: string | null
	runs: ToolRunRecord[]
	totalMs: number
}

export type ToolRunsQueryInput = {
	domiaKey: string
	interactionId: string
}

export type ToolRunsResult = {
	toolRuns: ToolRunRecord[]
}

export type ToolRunsPanelProps = {
	interactionId: string
	domiaKey: string
	mirrored: ToolRunGroup[]
}

export type ToolRunSource = "archived" | "live"

export type ToolRunRowProps = {
	run: ToolRunRecord
}

export type ToolRunGroupProps = {
	group: ToolRunGroup
}

export type ToolRunListProps = {
	groups: ToolRunGroup[]
	source: ToolRunSource
}
