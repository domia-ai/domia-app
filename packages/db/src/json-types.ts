export type JsonValue =
	| string
	| number
	| boolean
	| null
	| JsonValue[]
	| { [key: string]: JsonValue }

export type ToolRunStatus = "ok" | "failed" | "timeout" | "cancelled"

export type ToolResultErrorCode =
	| "error"
	| "blocked"
	| "unauthorized"
	| "timeout"

export type ToolTraceEntry =
	| {
			kind: "result"
			tool: string
			status: ToolRunStatus
			durationMs: number
			summaryForLlm: string
			output?: string
			displaySummary?: string
			errorCode?: ToolResultErrorCode
			args?: Record<string, JsonValue>
			resolvedArgs?: Record<string, JsonValue>
	  }
	| {
			kind: "dispatched"
			tool: string
			args?: Record<string, JsonValue>
	  }
	| {
			kind: "async_outcome"
			tool: string
			status: ToolRunStatus
			summaryForLlm: string
			output?: string
			resolvedArgs?: Record<string, JsonValue>
	  }
	| {
			kind: "summary"
			decisionMs: number
			toolMs: number
			finalizeMs: number
			finalizeMode: string
			stopReason: string
	  }
