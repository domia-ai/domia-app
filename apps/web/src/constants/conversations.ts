import { m } from "@/paraglide/messages"
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
	{ value: "up", label: m.conv_rating_good },
	{ value: "down", label: m.conv_rating_needs_work },
	{ value: "ungraded", label: m.conv_rating_ungraded },
]

export const PRESETS: ConversationPreset[] = [
	{
		key: "slowest",
		label: m.conv_preset_slowest,
		params: { sort: "latency", dir: "desc" },
	},
	{ key: "errors", label: m.conv_preset_errors, params: { error: "1" } },
	{
		key: "ungraded",
		label: m.conv_rating_ungraded,
		params: { rating: "ungraded" },
	},
	{ key: "tools", label: m.conv_facet_tool_calls, params: { tool: "1" } },
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

export const conversationFacets = (): FilterFacet[] => [
	{
		key: "flow",
		label: m.conv_col_flow,
		type: "chips",
		options: FLOWS.map((f) => ({
			label: f.key.toUpperCase(),
			value: f.key,
			color: f.className,
		})),
	},
	{
		key: "rating",
		label: m.conv_col_rating,
		type: "select",
		options: RATING_OPTIONS.map((r) => ({ label: r.label(), value: r.value })),
	},
	{ key: "tool", label: m.conv_facet_tool_calls, type: "toggle" },
	{ key: "domia", label: m.conv_col_domia, type: "multiselect" },
	{ key: "llmModel", label: m.conv_facet_llm_model, type: "multiselect" },
	{ key: "sttModel", label: m.conv_facet_stt_model, type: "multiselect" },
	{ key: "ttsEngine", label: m.conv_col_tts_engine, type: "multiselect" },
	{ key: "ttsVoice", label: m.conv_facet_tts_voice, type: "multiselect" },
	{ key: "live", label: m.conv_facet_live, type: "toggle" },
]

export const TOGGLEABLE_COLUMNS: ColumnToggle[] = [
	{ id: "flow", label: m.conv_col_flow },
	{ id: "latency", label: m.conv_col_latency },
	{ id: "rating", label: m.conv_col_rating },
	{ id: "executor", label: m.conv_col_executor },
	{ id: "tags", label: m.conv_col_tags },
	{ id: "ttsEngine", label: m.conv_col_tts_engine },
	{ id: "tool", label: m.conv_col_tool },
	{ id: "session", label: m.conv_col_session },
]
