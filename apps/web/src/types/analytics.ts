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
	key: "stt" | "llm" | "tts" | "ttfa" | "total"
	label: string
	p50: number | null
	p95: number | null
	avg: number | null
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
	onDevicePct: number
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
}

export type AnalyticsChartsProps = {
	timeSeries: TimeBucketRow[]
	histogram: HistogramBin[]
}
