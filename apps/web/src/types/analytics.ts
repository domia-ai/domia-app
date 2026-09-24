import type { LatencyStatsSummary, LatencyStatsView } from "@/types/latency"

export type AnalyticsInteractionRow = {
	id: string
	inputType: string | null
	responseType: string | null
	sttMs: number | null
	llmMs: number | null
	ttsMs: number | null
	ttfaMs: number | null
	totalMs: number | null
	sttModel: string | null
	llmModel: string | null
	ttsEngine: string | null
	llmExecutor: string | null
	source: string
	createdAt: string
	error: boolean
	input: string
	promptTokens: number | null
	completionTokens: number | null
	tokensPerSec: number | null
	ttftMs: number | null
	contextWindow: number | null
	toolCalls: number | null
	toolErrors: number | null
	inputAudioMs: number | null
	satelliteProtocol: string | null
	llmQueueMs: number | null
	rssMb: number | null
}

export type DomiaPerfRow = {
	sourceDomiaKey: string
	responseType: string | null
	sttMs: number | null
	llmMs: number | null
	ttsMs: number | null
	ttfaMs: number | null
	totalMs: number | null
	llmExecutorKey: string | null
	llmResponse: string | null
	sttModel: string | null
	llmModel: string | null
	ttsEngine: string | null
	createdAt: string
}

export type LatencyFields = {
	sttMs: number | null
	llmMs: number | null
	ttfaMs: number | null
	llmExecutorKey: string | null
	sourceDomiaKey: string
}

export type LatencySummary = {
	count: number
	p50: number | null
	p95: number | null
	avg: number | null
}

export type FlowLatencyRow = {
	flow: "s2s" | "t2t" | "t2s" | "v2t"
	count: number
	ttfa: LatencySummary
	total: LatencySummary
}

export type ExecutionLatencyRow = {
	kind: "local" | "delegated"
	count: number
	ttfa: LatencySummary
	total: LatencySummary
}

export type DomiaLatencyRow = {
	domiaKey: string
	name: string
	count: number
	ttfaP50: number | null
	totalP50: number | null
}

export type WaterfallStage = {
	key: "stt" | "llm" | "tts"
	label: string
	ms: number
}

export type WaterfallData = {
	stages: WaterfallStage[]
	ttfaMs: number
	sumMs: number
	pipelineGapMs: number
}

export type HistogramBin = {
	label: string
	count: number
}

export type ExemplarRow = {
	id: string
	flow: string
	domia: string
	ttfaMs: number
	totalMs: number | null
	input: string
}

export type StagePerfRow = {
	stage: "stt" | "llm" | "tts"
	model: string
	count: number
	avgMs: number | null
}

export type LatencyDistRow = {
	key: "stt" | "llmQueue" | "llm" | "ttft" | "tts" | "ttfa" | "total"
	label: string
	p50: number | null
	p95: number | null
	avg: number | null
}

export type TokenModelRow = {
	model: string
	count: number
	tokensPerSec: number | null
	promptTokens: number | null
	completionTokens: number | null
}

export type TokenStats = {
	turns: number
	avgTokensPerSec: number | null
	avgPromptTokens: number | null
	avgCompletionTokens: number | null
	avgContextPct: number | null
	byModel: TokenModelRow[]
}

export type ToolStats = {
	turnsWithTools: number
	withToolsPct: number | null
	totalCalls: number
	errorRate: number | null
}

export type SourceRow = {
	source: string
	count: number
}

export type TimeBucketRow = {
	bucket: string
	count: number
	errors: number
	avgMs: number | null
}

export type CorpusSummary = {
	graded: number
	up: number
	down: number
	tagged: number
}

export type HeroStats = {
	total: number
	s2sTtfaP50: number | null
	onDevicePct: number | null
	flows: number
}

export type AnalyticsData = {
	total: number
	hero: HeroStats
	byFlow: FlowLatencyRow[]
	execution: ExecutionLatencyRow[]
	waterfall: WaterfallData | null
	histogram: HistogramBin[]
	exemplars: { fastest: ExemplarRow | null; slowest: ExemplarRow | null }
	byDomia: DomiaLatencyRow[]
	modelPerf: StagePerfRow[]
	latency: LatencyDistRow[]
	timeSeries: TimeBucketRow[]
	corpus: CorpusSummary
	tokens: TokenStats
	ttftHistogram: HistogramBin[]
	tools: ToolStats
	sources: SourceRow[]
	avgInputAudioMs: number | null
	peakRssMb: number | null
}

export type AnalyticsChartsProps = {
	timeSeries: TimeBucketRow[]
	histogram: HistogramBin[]
}

export type LatencyStatsSectionProps = {
	stats: LatencyStatsSummary
}

export type LatencyStatsViewProps = {
	view: LatencyStatsView
}

export type LiveNodeMetricsBodyProps = {
	domiaKey: string
}
