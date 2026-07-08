import { count, desc, sql } from "drizzle-orm"
import {
	domiaRegistry,
	interactionLabel,
	interactionTrace,
} from "@domia-app/db"
import { db } from "@/db"
import { deriveFlow } from "@/utils/flow"
import { avgOf, effectiveTtfa, isDelegated, summarize } from "@/utils/metrics"
import type {
	AnalyticsData,
	DomiaLatencyRow,
	ExemplarRow,
	FlowLatencyRow,
	HistogramBin,
	LatencyDistRow,
	StagePerfRow,
	TimeBucketRow,
	WaterfallData,
	TokenStats,
	ToolStats,
	SourceRow,
} from "@/types/analytics"

const avgDec = (values: number[]): number | null => {
	const f = values.filter((v) => Number.isFinite(v) && v > 0)
	if (!f.length) return null
	return Math.round((f.reduce((a, b) => a + b, 0) / f.length) * 10) / 10
}

type Row = {
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

const num = (v: number | null | undefined): number | null =>
	v == null ? null : v
const eff = (r: Row): number =>
	effectiveTtfa({
		sttMs: r.sttMs,
		llmMs: r.llmMs,
		ttfaMs: r.ttfaMs,
		llmExecutorKey: r.llmExecutor,
		sourceDomiaKey: r.source,
	})
const delegated = (r: Row): boolean =>
	isDelegated({
		sttMs: r.sttMs,
		llmMs: r.llmMs,
		ttfaMs: r.ttfaMs,
		llmExecutorKey: r.llmExecutor,
		sourceDomiaKey: r.source,
	})

const HIST_BINS: { max: number; label: string }[] = [
	{ max: 1000, label: "< 1s" },
	{ max: 2000, label: "1–2s" },
	{ max: 3000, label: "2–3s" },
	{ max: 4000, label: "3–4s" },
	{ max: 5000, label: "4–5s" },
	{ max: Infinity, label: "5s+" },
]

export const getAnalytics = async (): Promise<AnalyticsData> => {
	const [rows, names, corpus] = await Promise.all([
		db
			.select({
				id: interactionTrace.id,
				inputType: interactionTrace.inputType,
				responseType: interactionTrace.responseType,
				sttMs: interactionTrace.sttMs,
				llmMs: interactionTrace.llmMs,
				ttsMs: interactionTrace.ttsMs,
				ttfaMs: interactionTrace.ttfaMs,
				totalMs: interactionTrace.totalMs,
				sttModel: interactionTrace.sttModelUsed,
				llmModel: interactionTrace.llmModelUsed,
				ttsEngine: interactionTrace.ttsEngineUsed,
				llmExecutor: interactionTrace.llmExecutorKey,
				source: interactionTrace.sourceDomiaKey,
				createdAt: interactionTrace.createdAt,
				llmResponse: interactionTrace.llmResponse,
				sttResult: interactionTrace.sttResult,
				inputRaw: interactionTrace.inputRaw,
				promptTokens: interactionTrace.llmPromptTokens,
				completionTokens: interactionTrace.llmCompletionTokens,
				tokensPerSec: interactionTrace.llmTokensPerSec,
				ttftMs: interactionTrace.llmTtftMs,
				contextWindow: interactionTrace.llmContextWindow,
				toolCalls: interactionTrace.toolCallCount,
				toolErrors: interactionTrace.toolErrorCount,
				inputAudioMs: interactionTrace.inputAudioMs,
				satelliteProtocol: interactionTrace.satelliteProtocol,
				llmQueueMs: interactionTrace.llmQueueMs,
				rssMb: interactionTrace.rssMb,
			})
			.from(interactionTrace)
			.orderBy(desc(interactionTrace.createdAt)),
		db
			.select({ domiaKey: domiaRegistry.domiaKey, name: domiaRegistry.name })
			.from(domiaRegistry),
		db
			.select({
				graded: count(),
				up: sql<number>`sum(case when ${interactionLabel.rating}='up' then 1 else 0 end)`,
				down: sql<number>`sum(case when ${interactionLabel.rating}='down' then 1 else 0 end)`,
				tagged: sql<number>`sum(case when ${interactionLabel.tags} is not null then 1 else 0 end)`,
			})
			.from(interactionLabel),
	])

	const nameOf = new Map(names.map((n) => [n.domiaKey, n.name ?? n.domiaKey]))
	const data: Row[] = rows.map((r) => ({
		id: r.id,
		inputType: r.inputType,
		responseType: r.responseType,
		sttMs: r.sttMs,
		llmMs: r.llmMs,
		ttsMs: r.ttsMs,
		ttfaMs: r.ttfaMs,
		totalMs: r.totalMs,
		sttModel: r.sttModel,
		llmModel: r.llmModel,
		ttsEngine: r.ttsEngine,
		llmExecutor: r.llmExecutor,
		source: r.source,
		createdAt: r.createdAt,
		error: r.llmResponse == null || r.llmResponse === "",
		input: r.sttResult ?? r.inputRaw ?? "—",
		promptTokens: r.promptTokens,
		completionTokens: r.completionTokens,
		tokensPerSec: r.tokensPerSec,
		ttftMs: r.ttftMs,
		contextWindow: r.contextWindow,
		toolCalls: r.toolCalls,
		toolErrors: r.toolErrors,
		inputAudioMs: r.inputAudioMs,
		satelliteProtocol: r.satelliteProtocol,
		llmQueueMs: r.llmQueueMs,
		rssMb: r.rssMb,
	}))

	const flowOf = (r: Row) => deriveFlow(r.inputType, r.responseType)

	const byFlow: FlowLatencyRow[] = (["s2s", "t2s", "v2t", "t2t"] as const)
		.map((flow) => {
			const rs = data.filter((r) => flowOf(r) === flow)
			return {
				flow,
				count: rs.length,
				ttfa: summarize(rs.map(eff)),
				total: summarize(rs.map((r) => r.totalMs ?? 0)),
			}
		})
		.filter((f) => f.count > 0)

	const execution = (["local", "delegated"] as const)
		.map((kind) => {
			const rs = data.filter((r) =>
				kind === "delegated" ? delegated(r) : !delegated(r),
			)
			return {
				kind,
				count: rs.length,
				ttfa: summarize(rs.map(eff)),
				total: summarize(rs.map((r) => r.totalMs ?? 0)),
			}
		})
		.filter((e) => e.count > 0)

	const voiceOut = data.filter((r) => r.responseType === "voice" && eff(r) > 0)
	const waterfall: WaterfallData | null = voiceOut.length
		? (() => {
				const stt = avgOf(voiceOut.map((r) => r.sttMs ?? 0))
				const llm = avgOf(voiceOut.map((r) => r.llmMs ?? 0))
				const tts = avgOf(voiceOut.map((r) => r.ttsMs ?? 0))
				const ttfa = avgOf(voiceOut.map(eff))
				const sum = stt + llm + tts
				return {
					stages: [
						{ key: "stt" as const, label: "STT", ms: stt },
						{ key: "llm" as const, label: "LLM", ms: llm },
						{ key: "tts" as const, label: "TTS", ms: tts },
					],
					ttfaMs: ttfa,
					sumMs: sum,
					pipelineGapMs: Math.max(0, sum - ttfa),
				}
			})()
		: null

	const histogram: HistogramBin[] = HIST_BINS.map((bin, i) => {
		const lo = i === 0 ? 0 : HIST_BINS[i - 1].max
		return {
			label: bin.label,
			count: data.filter((r) => {
				const t = eff(r)
				return t > lo && t <= bin.max
			}).length,
		}
	})

	const ranked = data
		.filter((r) => eff(r) > 0 && !r.error)
		.sort((a, b) => eff(a) - eff(b))
	const toExemplar = (r: Row | undefined): ExemplarRow | null =>
		r
			? {
					id: r.id,
					flow: flowOf(r),
					domia: nameOf.get(r.source) ?? r.source,
					ttfaMs: eff(r),
					totalMs: num(r.totalMs),
					input: r.input,
				}
			: null

	const domiaKeys = [...new Set(data.map((r) => r.source))]
	const byDomia: DomiaLatencyRow[] = domiaKeys
		.map((key) => {
			const rs = data.filter((r) => r.source === key)
			return {
				domiaKey: key,
				name: nameOf.get(key) ?? key,
				count: rs.length,
				ttfaP50: summarize(rs.map(eff)).p50,
				totalP50: summarize(rs.map((r) => r.totalMs ?? 0)).p50,
			}
		})
		.sort((a, b) => b.count - a.count)

	const stagePerf = (
		pick: (r: Row) => string | null,
		ms: (r: Row) => number | null,
		stage: StagePerfRow["stage"],
	): StagePerfRow[] => {
		const groups = new Map<string, number[]>()
		for (const r of data) {
			const model = pick(r)
			if (!model) continue
			const arr = groups.get(model) ?? []
			const m = ms(r)
			if (m != null && m > 0) arr.push(m)
			groups.set(model, arr)
		}
		return [...groups.entries()].map(([model, vals]) => ({
			stage,
			model,
			count: vals.length,
			avgMs: vals.length ? avgOf(vals) : null,
		}))
	}

	const latency: LatencyDistRow[] = [
		["stt", "Speech-to-text", data.map((r) => r.sttMs ?? 0)],
		["llmQueue", "Reply admission queue", data.map((r) => r.llmQueueMs ?? 0)],
		["llm", "LLM", data.map((r) => r.llmMs ?? 0)],
		["ttft", "Time to first token", data.map((r) => r.ttftMs ?? 0)],
		["tts", "Text-to-speech", data.map((r) => r.ttsMs ?? 0)],
		["ttfa", "Time to first audio", data.map(eff)],
		["total", "Total", data.map((r) => r.totalMs ?? 0)],
	].map(([key, label, vals]) => {
		const s = summarize(vals as number[])
		return {
			key: key as LatencyDistRow["key"],
			label: label as string,
			p50: s.p50,
			p95: s.p95,
			avg: s.avg,
		}
	})

	const tsMap = new Map<
		string,
		{ count: number; errors: number; ms: number[] }
	>()
	for (const r of data) {
		const bucket = r.createdAt.slice(0, 10)
		const b = tsMap.get(bucket) ?? { count: 0, errors: 0, ms: [] }
		b.count++
		if (r.error) b.errors++
		if (r.totalMs && r.totalMs > 0) b.ms.push(r.totalMs)
		tsMap.set(bucket, b)
	}
	const timeSeries: TimeBucketRow[] = [...tsMap.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([bucket, b]) => ({
			bucket,
			count: b.count,
			errors: b.errors,
			avgMs: b.ms.length ? avgOf(b.ms) : null,
		}))

	const tokenRows = data.filter((r) => r.completionTokens != null)
	const tokenModels = new Map<string, Row[]>()
	for (const r of tokenRows) {
		if (!r.llmModel) continue
		const arr = tokenModels.get(r.llmModel) ?? []
		arr.push(r)
		tokenModels.set(r.llmModel, arr)
	}
	const ctxPcts = tokenRows
		.filter((r) => r.contextWindow && r.promptTokens != null)
		.map(
			(r) => ((r.promptTokens as number) / (r.contextWindow as number)) * 100,
		)
	const tokens: TokenStats = {
		turns: tokenRows.length,
		avgTokensPerSec: avgDec(tokenRows.map((r) => r.tokensPerSec ?? 0)),
		avgPromptTokens: avgOf(tokenRows.map((r) => r.promptTokens ?? 0)) || null,
		avgCompletionTokens:
			avgOf(tokenRows.map((r) => r.completionTokens ?? 0)) || null,
		avgContextPct: ctxPcts.length ? Math.round(avgOf(ctxPcts)) : null,
		byModel: [...tokenModels.entries()]
			.map(([model, rs]) => ({
				model,
				count: rs.length,
				tokensPerSec: avgDec(rs.map((r) => r.tokensPerSec ?? 0)),
				promptTokens: avgOf(rs.map((r) => r.promptTokens ?? 0)) || null,
				completionTokens: avgOf(rs.map((r) => r.completionTokens ?? 0)) || null,
			}))
			.sort((a, b) => b.count - a.count),
	}

	const TTFT_BINS: { max: number; label: string }[] = [
		{ max: 250, label: "< 250ms" },
		{ max: 500, label: "250–500" },
		{ max: 750, label: "500–750" },
		{ max: 1000, label: "750ms–1s" },
		{ max: 1500, label: "1–1.5s" },
		{ max: Infinity, label: "1.5s+" },
	]
	const ttftHistogram: HistogramBin[] = TTFT_BINS.map((bin, i) => {
		const lo = i === 0 ? 0 : TTFT_BINS[i - 1].max
		return {
			label: bin.label,
			count: data.filter((r) => {
				const t = r.ttftMs ?? 0
				return t > lo && t <= bin.max
			}).length,
		}
	})

	const toolTurns = data.filter((r) => (r.toolCalls ?? 0) > 0)
	const totalCalls = data.reduce((s, r) => s + (r.toolCalls ?? 0), 0)
	const totalToolErrors = data.reduce((s, r) => s + (r.toolErrors ?? 0), 0)
	const tools: ToolStats = {
		turnsWithTools: toolTurns.length,
		withToolsPct: data.length
			? Math.round((toolTurns.length / data.length) * 100)
			: null,
		totalCalls,
		errorRate: totalCalls
			? Math.round((totalToolErrors / totalCalls) * 100)
			: null,
	}

	const srcMap = new Map<string, number>()
	for (const r of data) {
		const src = r.satelliteProtocol ?? "local mic"
		srcMap.set(src, (srcMap.get(src) ?? 0) + 1)
	}
	const sources: SourceRow[] = [...srcMap.entries()]
		.map(([source, count]) => ({ source, count }))
		.sort((a, b) => b.count - a.count)
	const avgInputAudioMs = avgOf(data.map((r) => r.inputAudioMs ?? 0)) || null
	const peakRssMb =
		Math.max(0, ...data.map((r) => r.rssMb ?? 0).filter((n) => n > 0)) || null

	const s2s = byFlow.find((f) => f.flow === "s2s")

	const localCount = data.filter((r) => !delegated(r)).length

	return {
		total: data.length,
		hero: {
			total: data.length,
			s2sTtfaP50: s2s?.ttfa.p50 ?? null,
			onDevicePct: data.length
				? Math.round((localCount / data.length) * 100)
				: null,
			flows: byFlow.length,
		},
		byFlow,
		execution,
		waterfall,
		histogram,
		exemplars: {
			fastest: toExemplar(ranked[0]),
			slowest: toExemplar(ranked[ranked.length - 1]),
		},
		byDomia,
		modelPerf: [
			...stagePerf(
				(r) => r.sttModel,
				(r) => r.sttMs,
				"stt",
			),
			...stagePerf(
				(r) => r.llmModel,
				(r) => r.llmMs,
				"llm",
			),
			...stagePerf(
				(r) => r.ttsEngine,
				(r) => r.ttsMs,
				"tts",
			),
		],
		latency,
		timeSeries,
		corpus: {
			graded: corpus[0]?.graded ?? 0,
			up: Number(corpus[0]?.up ?? 0),
			down: Number(corpus[0]?.down ?? 0),
			tagged: Number(corpus[0]?.tagged ?? 0),
		},
		tokens,
		ttftHistogram,
		tools,
		sources,
		avgInputAudioMs,
		peakRssMb,
	}
}
