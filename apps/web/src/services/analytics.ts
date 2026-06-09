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
} from "@/types/analytics"

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
		["llm", "LLM", data.map((r) => r.llmMs ?? 0)],
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

	const s2s = byFlow.find((f) => f.flow === "s2s")

	return {
		total: data.length,
		hero: {
			total: data.length,
			s2sTtfaP50: s2s?.ttfa.p50 ?? null,
			onDevicePct: 100,
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
	}
}
