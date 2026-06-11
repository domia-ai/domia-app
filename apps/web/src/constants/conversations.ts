import type { ConversationPreset, FlowDef } from "@/types/conversations"
import type { ColumnToggle, FilterFacet } from "@/types/table"

export const FLOWS: FlowDef[] = [
	{
		key: "s2s",
		label: "Voice → Voice",
		inputType: "VOICE",
		responseType: "voice",
		className: "bg-chart-1",
	},
	{
		key: "t2t",
		label: "Text → Text",
		inputType: "TEXT",
		responseType: "text",
		className: "bg-chart-2",
	},
	{
		key: "t2s",
		label: "Text → Voice",
		inputType: "TEXT",
		responseType: "voice",
		className: "bg-chart-3",
	},
	{
		key: "v2t",
		label: "Voice → Text",
		inputType: "VOICE",
		responseType: "text",
		className: "bg-chart-4",
	},
]

export const RATING_OPTIONS = [
	{ value: "up", label: "Good" },
	{ value: "down", label: "Needs work" },
	{ value: "ungraded", label: "Ungraded" },
]

export const PRESETS: ConversationPreset[] = [
	{
		key: "slowest",
		label: "Slowest",
		params: { sort: "latency", dir: "desc" },
	},
	{ key: "errors", label: "Errors", params: { error: "1" } },
	{ key: "ungraded", label: "Ungraded", params: { rating: "ungraded" } },
	{ key: "tools", label: "Tool calls", params: { tool: "1" } },
]

export const CONVERSATION_FILTER_KEYS = [
	"domia",
	"flow",
	"rating",
	"tool",
	"error",
	"from",
	"to",
	"latMin",
	"latMax",
	"llmModel",
	"sttModel",
	"ttsEngine",
	"ttsVoice",
	"live",
]

export const LIVE_REFRESH_MS = 5000

export const CONVERSATION_EXPORT_MAX = 5000

export const DEFAULT_VISIBLE_COLUMNS: Record<string, boolean> = {
	executor: false,
	tags: false,
	ttsEngine: false,
	tool: false,
	session: false,
}

export const CONVERSATION_FACETS: FilterFacet[] = [
	{
		key: "flow",
		label: "Flow",
		type: "chips",
		options: FLOWS.map((f) => ({
			label: f.key.toUpperCase(),
			value: f.key,
			color: f.className,
		})),
	},
	{
		key: "rating",
		label: "Rating",
		type: "select",
		options: RATING_OPTIONS.map((r) => ({ label: r.label, value: r.value })),
	},
	{ key: "tool", label: "Tool calls", type: "toggle" },
	{ key: "domia", label: "Domia", type: "multiselect" },
	{ key: "llmModel", label: "LLM model", type: "multiselect" },
	{ key: "sttModel", label: "STT model", type: "multiselect" },
	{ key: "ttsEngine", label: "TTS engine", type: "multiselect" },
	{ key: "ttsVoice", label: "TTS voice", type: "multiselect" },
	{ key: "live", label: "Live", type: "toggle" },
]

export const TOGGLEABLE_COLUMNS: ColumnToggle[] = [
	{ id: "flow", label: "Flow" },
	{ id: "latency", label: "Latency" },
	{ id: "rating", label: "Rating" },
	{ id: "executor", label: "Executor" },
	{ id: "tags", label: "Tags" },
	{ id: "ttsEngine", label: "TTS engine" },
	{ id: "tool", label: "Tool" },
	{ id: "session", label: "Session" },
]
