import { count, desc, gte, sql } from "drizzle-orm"
import {
	domiaRegistry,
	interactionSessionTrace,
	interactionTrace,
} from "@domia-app/db"
import { db } from "@/db"
import { ONLINE_THRESHOLD_MS } from "@/utils/presence"
import { fromSqliteTs, toSqliteTs } from "@/utils/format"
import { parseConfigSnapshot } from "@/utils/config"
import { deriveFlow } from "@/utils/flow"
import { avgOf, effectiveTtfa, isDelegated, summarize } from "@/utils/metrics"
import type { MeshEdge, OverviewStats } from "@/types"
import type {
	DomiaTelemetry,
	MeshDomiaRow,
	OverviewActivity,
	OverviewData,
	OverviewPerformance,
	RecentInteraction,
} from "@/types/fleet"
import type { TimeBucketRow } from "@/types/analytics"

const ACTIVE_SESSION_WINDOW_MS = 30 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const RECENT_LIMIT = 6

export const listMeshDomias = async (): Promise<MeshDomiaRow[]> => {
	const rows = await db
		.select()
		.from(domiaRegistry)
		.orderBy(desc(domiaRegistry.lastSeenAt))
	return rows.map((row) => ({
		...row,
		config: parseConfigSnapshot(row.configSnapshotJson),
	}))
}

export const buildMeshEdges = (rows: MeshDomiaRow[]): MeshEdge[] => {
	const edges: MeshEdge[] = []
	for (const row of rows) {
		for (const delegation of row.config.capabilityDelegations) {
			edges.push({
				source: row.domiaKey,
				target: delegation.targetDomiaKey,
				capability: delegation.capability,
			})
		}
	}
	return edges
}

export const getOverviewStats = async (): Promise<
	Omit<OverviewStats, "conversationsAllTime">
> => {
	const [fleet] = await db
		.select({
			discovered: count(),
			online: sql<number>`sum(case when ${domiaRegistry.lastSeenAt} >= ${Date.now() - ONLINE_THRESHOLD_MS} then 1 else 0 end)`,
		})
		.from(domiaRegistry)

	const [sessions] = await db
		.select({ value: count() })
		.from(interactionSessionTrace)
		.where(
			gte(
				interactionSessionTrace.lastUsedAt,
				toSqliteTs(Date.now() - ACTIVE_SESSION_WINDOW_MS),
			),
		)

	const discovered = fleet?.discovered ?? 0
	const online = Number(fleet?.online ?? 0)
	return {
		discovered,
		online,
		offline: discovered - online,
		activeSessions: sessions?.value ?? 0,
	}
}

type LeanRow = {
	id: string
	sourceDomiaKey: string
	inputType: string | null
	responseType: string | null
	sttMs: number | null
	llmMs: number | null
	ttsMs: number | null
	ttfaMs: number | null
	totalMs: number | null
	llmExecutorKey: string | null
	llmResponse: string | null
	sttResult: string | null
	inputRaw: string | null
	createdAt: string
}

const latencyFields = (r: LeanRow) => ({
	sttMs: r.sttMs,
	llmMs: r.llmMs,
	ttfaMs: r.ttfaMs,
	llmExecutorKey: r.llmExecutorKey,
	sourceDomiaKey: r.sourceDomiaKey,
})

const buildTrend = (rows: LeanRow[]): TimeBucketRow[] => {
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

const pullInteractions = async (): Promise<LeanRow[]> =>
	db
		.select({
			id: interactionTrace.id,
			sourceDomiaKey: interactionTrace.sourceDomiaKey,
			inputType: interactionTrace.inputType,
			responseType: interactionTrace.responseType,
			sttMs: interactionTrace.sttMs,
			llmMs: interactionTrace.llmMs,
			ttsMs: interactionTrace.ttsMs,
			ttfaMs: interactionTrace.ttfaMs,
			totalMs: interactionTrace.totalMs,
			llmExecutorKey: interactionTrace.llmExecutorKey,
			llmResponse: interactionTrace.llmResponse,
			sttResult: interactionTrace.sttResult,
			inputRaw: interactionTrace.inputRaw,
			createdAt: interactionTrace.createdAt,
		})
		.from(interactionTrace)
		.orderBy(desc(interactionTrace.createdAt))

const ACTIVITY_DENSE_DAY_LIMIT = 2
const ACTIVITY_DAY_SLOTS = 14

const buildActivity = (rows: LeanRow[]): OverviewActivity => {
	const days = new Set(rows.map((r) => r.createdAt.slice(0, 10)))

	if (days.size > 0 && days.size <= ACTIVITY_DENSE_DAY_LIMIT) {
		const since = Date.now() - DAY_MS
		const map = new Map<string, number>()
		for (const r of rows) {
			const d = fromSqliteTs(r.createdAt)
			if (!d || d.getTime() < since) continue
			const key = r.createdAt.slice(0, 13)
			map.set(key, (map.get(key) ?? 0) + 1)
		}
		const buckets = [...map.entries()]
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([bucket, count]) => ({
				bucket,
				label: `${bucket.slice(11, 13)}:00`,
				count,
			}))
		return { granularity: "hour", label: "last 24 hours", buckets }
	}

	const map = new Map<string, number>()
	for (const r of rows) {
		const key = r.createdAt.slice(0, 10)
		map.set(key, (map.get(key) ?? 0) + 1)
	}
	const buckets = [...map.entries()]
		.sort((a, b) => a[0].localeCompare(b[0]))
		.slice(-ACTIVITY_DAY_SLOTS)
		.map(([bucket, count]) => ({ bucket, label: bucket.slice(5), count }))
	return { granularity: "day", label: "last 14 days", buckets }
}

const buildPerformance = (rows: LeanRow[]): OverviewPerformance => {
	const total = rows.length
	const s2s = rows.filter(
		(r) => deriveFlow(r.inputType, r.responseType) === "s2s",
	)
	const s2sTtfa = summarize(s2s.map((r) => effectiveTtfa(latencyFields(r))))
	const localCount = rows.filter((r) => !isDelegated(latencyFields(r))).length
	const errors = rows.filter((r) => !r.llmResponse).length
	const since = Date.now() - DAY_MS
	const volume24h = rows.filter((r) => {
		const d = fromSqliteTs(r.createdAt)
		return d != null && d.getTime() >= since
	}).length
	const voice = rows.filter((r) => r.responseType === "voice")
	return {
		s2sTtfaP50: s2sTtfa.p50,
		s2sTtfaP95: s2sTtfa.p95,
		localExecPct: total ? Math.round((localCount / total) * 100) : null,
		errorRate: total ? Math.round((errors / total) * 100) : 0,
		volume24h,
		stageAvg: {
			stt: avgOf(voice.map((r) => r.sttMs ?? 0)),
			llm: avgOf(voice.map((r) => r.llmMs ?? 0)),
			tts: avgOf(voice.map((r) => r.ttsMs ?? 0)),
		},
		trend: buildTrend(rows),
		activity: buildActivity(rows),
	}
}

const buildTelemetryMap = (rows: LeanRow[]): Record<string, DomiaTelemetry> => {
	const groups = new Map<string, LeanRow[]>()
	for (const r of rows) {
		const arr = groups.get(r.sourceDomiaKey) ?? []
		arr.push(r)
		groups.set(r.sourceDomiaKey, arr)
	}
	const out: Record<string, DomiaTelemetry> = {}
	for (const [key, rs] of groups.entries()) {
		out[key] = {
			count: rs.length,
			ttfaP50: summarize(rs.map((r) => effectiveTtfa(latencyFields(r)))).p50,
		}
	}
	return out
}

const buildRecent = (
	rows: LeanRow[],
	dirByKey: Map<string, { name: string; avatarId: string | null }>,
): RecentInteraction[] =>
	rows.slice(0, RECENT_LIMIT).map((r) => ({
		id: r.id,
		sourceDomiaKey: r.sourceDomiaKey,
		sourceDomiaName: dirByKey.get(r.sourceDomiaKey)?.name ?? null,
		sourceDomiaAvatarId: dirByKey.get(r.sourceDomiaKey)?.avatarId ?? null,
		input: r.sttResult ?? r.inputRaw ?? "—",
		reply: r.llmResponse,
		flow: deriveFlow(r.inputType, r.responseType),
		ttfaMs:
			effectiveTtfa(latencyFields(r)) > 0
				? effectiveTtfa(latencyFields(r))
				: null,
		delegated: isDelegated(latencyFields(r)),
		createdAt: r.createdAt,
	}))

export const getOverviewData = async (): Promise<OverviewData> => {
	const [rows, stats, interactions] = await Promise.all([
		listMeshDomias(),
		getOverviewStats(),
		pullInteractions(),
	])
	const dirByKey = new Map(
		rows.map((r) => [r.domiaKey, { name: r.name, avatarId: r.avatarId }]),
	)
	return {
		rows,
		edges: buildMeshEdges(rows),
		stats: { ...stats, conversationsAllTime: interactions.length },
		performance: buildPerformance(interactions),
		recent: buildRecent(interactions, dirByKey),
		telemetry: buildTelemetryMap(interactions),
	}
}
