import { desc, eq } from "drizzle-orm"
import { domiaRegistry, interactionTrace } from "@domia-app/db"
import { db } from "@/db"
import { avgOf, effectiveTtfa, isDelegated, summarize } from "@/utils/metrics"
import { deriveFlow } from "@/utils/flow"
import type { StagePerfRow, TimeBucketRow } from "@/types/analytics"
import type {
	DomiaPerformance,
	DomiaRecentRow,
	MeshDomiaRow,
} from "@/types/fleet"

import { parseConfigSnapshot } from "@/utils/config"

export { parseConfigSnapshot } from "@/utils/config"

export const getDomia = async (
	domiaKey: string,
): Promise<MeshDomiaRow | null> => {
	const [row] = await db
		.select()
		.from(domiaRegistry)
		.where(eq(domiaRegistry.domiaKey, domiaKey))
		.limit(1)
	if (!row) return null
	return { ...row, config: parseConfigSnapshot(row.configSnapshotJson) }
}

export const getRecentInteractions = async (
	domiaKey: string,
	limit = 5,
): Promise<DomiaRecentRow[]> => {
	const rows = await db
		.select()
		.from(interactionTrace)
		.where(eq(interactionTrace.sourceDomiaKey, domiaKey))
		.orderBy(desc(interactionTrace.createdAt))
		.limit(limit)
	return rows.map((r) => {
		const ttfa = effectiveTtfa(r)
		return {
			id: r.id,
			input: r.sttResult ?? r.inputRaw ?? "—",
			reply: r.llmResponse,
			flow: deriveFlow(r.inputType, r.responseType),
			ttfaMs: ttfa > 0 ? ttfa : null,
			createdAt: r.createdAt,
		}
	})
}

type PerfRow = {
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

const stagePerf = (
	rows: PerfRow[],
	pick: (r: PerfRow) => string | null,
	ms: (r: PerfRow) => number | null,
	stage: StagePerfRow["stage"],
): StagePerfRow[] => {
	const groups = new Map<string, number[]>()
	for (const r of rows) {
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

const buildTrend = (rows: PerfRow[]): TimeBucketRow[] => {
	const map = new Map<string, { count: number; errors: number; ms: number[] }>()
	for (const r of rows) {
		const bucket = r.createdAt.slice(0, 10)
		const b = map.get(bucket) ?? { count: 0, errors: 0, ms: [] }
		b.count++
		if (!r.llmResponse) b.errors++
		if (r.totalMs && r.totalMs > 0) b.ms.push(r.totalMs)
		map.set(bucket, b)
	}
	return [...map.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.map(([bucket, b]) => ({
			bucket,
			count: b.count,
			errors: b.errors,
			avgMs: b.ms.length ? avgOf(b.ms) : null,
		}))
}

export const getDomiaPerformance = async (
	domiaKey: string,
): Promise<DomiaPerformance> => {
	const rows = await db
		.select({
			sourceDomiaKey: interactionTrace.sourceDomiaKey,
			responseType: interactionTrace.responseType,
			sttMs: interactionTrace.sttMs,
			llmMs: interactionTrace.llmMs,
			ttsMs: interactionTrace.ttsMs,
			ttfaMs: interactionTrace.ttfaMs,
			totalMs: interactionTrace.totalMs,
			llmExecutorKey: interactionTrace.llmExecutorKey,
			llmResponse: interactionTrace.llmResponse,
			sttModel: interactionTrace.sttModelUsed,
			llmModel: interactionTrace.llmModelUsed,
			ttsEngine: interactionTrace.ttsEngineUsed,
			createdAt: interactionTrace.createdAt,
		})
		.from(interactionTrace)
		.where(eq(interactionTrace.sourceDomiaKey, domiaKey))
		.orderBy(desc(interactionTrace.createdAt))

	const eff = (r: PerfRow) => effectiveTtfa(r)
	const local = rows.filter((r) => !isDelegated(r))
	const delegatedRows = rows.filter((r) => isDelegated(r))

	const voice = rows.filter((r) => r.responseType === "voice" && eff(r) > 0)
	const stt = avgOf(voice.map((r) => r.sttMs ?? 0))
	const llm = avgOf(voice.map((r) => r.llmMs ?? 0))
	const tts = avgOf(voice.map((r) => r.ttsMs ?? 0))
	const ttfaAvg = avgOf(voice.map(eff))
	const sum = stt + llm + tts

	return {
		count: rows.length,
		ttfa: summarize(rows.map(eff)),
		total: summarize(rows.map((r) => r.totalMs ?? 0)),
		waterfall: voice.length
			? {
					stages: [
						{ key: "stt", label: "STT", ms: stt },
						{ key: "llm", label: "LLM", ms: llm },
						{ key: "tts", label: "TTS", ms: tts },
					],
					ttfaMs: ttfaAvg,
					sumMs: sum,
					pipelineGapMs: Math.max(0, sum - ttfaAvg),
				}
			: null,
		execution: {
			localCount: local.length,
			delegatedCount: delegatedRows.length,
			localP50: summarize(local.map(eff)).p50,
			delegatedP50: summarize(delegatedRows.map(eff)).p50,
		},
		trend: buildTrend(rows),
		topModels: [
			...stagePerf(
				rows,
				(r) => r.sttModel,
				(r) => r.sttMs,
				"stt",
			),
			...stagePerf(
				rows,
				(r) => r.llmModel,
				(r) => r.llmMs,
				"llm",
			),
			...stagePerf(
				rows,
				(r) => r.ttsEngine,
				(r) => r.ttsMs,
				"tts",
			),
		],
	}
}
