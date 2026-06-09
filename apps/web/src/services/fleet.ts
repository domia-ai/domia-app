import { count, desc, eq, gte, sql } from "drizzle-orm"
import {
	domiaRegistry,
	interactionSessionTrace,
	interactionTrace,
	type DomiaRegistryRow,
} from "@domia-app/db"
import { db } from "@/db"
import { buildOrderBy, buildSearchWhere } from "@/utils/table-builders"
import { ONLINE_THRESHOLD_MS, isOnline } from "@/utils/presence"
import { parseConfigSnapshot } from "@/utils/config"
import { fromSqliteTs, toSqliteTs } from "@/utils/format"
import { deriveFlow } from "@/utils/flow"
import { effectiveTtfa, isDelegated, summarize } from "@/utils/metrics"
import type { Paginated, TableParams } from "@/types/table"
import type { FleetStats } from "@/types"
import type { RunTarget } from "@/types/conversations"
import type {
	DomiaRole,
	DomiaTarget,
	FleetRow,
	FleetStatsFull,
	FleetTelemetry,
} from "@/types/fleet"

const ACTIVE_SESSION_WINDOW_MS = 30 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000

export const listRunTargets = async (
	originKey: string,
): Promise<RunTarget[]> => {
	const rows = await db
		.select({
			domiaKey: domiaRegistry.domiaKey,
			name: domiaRegistry.name,
			localIp: domiaRegistry.localIp,
			httpPort: domiaRegistry.httpPort,
			lastSeenAt: domiaRegistry.lastSeenAt,
		})
		.from(domiaRegistry)

	return rows
		.filter((r) => r.localIp && r.httpPort)
		.map((r) => ({
			domiaKey: r.domiaKey,
			name: r.name,
			localIp: r.localIp as string,
			httpPort: r.httpPort as number,
			isOrigin: r.domiaKey === originKey,
			online: isOnline(r.lastSeenAt),
		}))
		.sort((a, b) => Number(b.isOrigin) - Number(a.isOrigin))
}

export const getNodeEndpoint = async (
	domiaKey: string,
): Promise<{ localIp: string; httpPort: number } | null> => {
	const [row] = await db
		.select({
			localIp: domiaRegistry.localIp,
			httpPort: domiaRegistry.httpPort,
		})
		.from(domiaRegistry)
		.where(eq(domiaRegistry.domiaKey, domiaKey))
		.limit(1)
	if (!row?.localIp || !row.httpPort) return null
	return { localIp: row.localIp, httpPort: row.httpPort }
}

const SEARCH_COLUMNS = [domiaRegistry.name, domiaRegistry.domiaKey]

const SORTABLE = {
	name: domiaRegistry.name,
	lastSeenAt: domiaRegistry.lastSeenAt,
	lastInteractionAt: domiaRegistry.lastInteractionAt,
}

export const listDomiaTargets = async (): Promise<DomiaTarget[]> => {
	const rows = await db
		.select({
			domiaKey: domiaRegistry.domiaKey,
			name: domiaRegistry.name,
			lastSeenAt: domiaRegistry.lastSeenAt,
		})
		.from(domiaRegistry)
		.orderBy(domiaRegistry.name)
	return rows.map((r) => ({
		domiaKey: r.domiaKey,
		name: r.name,
		online: isOnline(r.lastSeenAt),
	}))
}

export const listDomias = async (
	params: TableParams,
): Promise<Paginated<DomiaRegistryRow>> => {
	const where = buildSearchWhere(SEARCH_COLUMNS, params.search)
	const orderBy = buildOrderBy(
		SORTABLE,
		params.sort,
		desc(domiaRegistry.lastSeenAt),
	)

	const rows = await db
		.select()
		.from(domiaRegistry)
		.where(where)
		.orderBy(...orderBy)
		.limit(params.pageSize)
		.offset(params.page * params.pageSize)

	const [totals] = await db
		.select({ value: count() })
		.from(domiaRegistry)
		.where(where)

	return { rows, total: totals?.value ?? 0 }
}

export const getFleetStats = async (): Promise<FleetStats> => {
	const threshold = Date.now() - ONLINE_THRESHOLD_MS
	const [row] = await db
		.select({
			total: count(),
			online: sql<number>`sum(case when ${domiaRegistry.lastSeenAt} >= ${threshold} then 1 else 0 end)`,
			active: sql<number>`sum(case when ${domiaRegistry.isActive} then 1 else 0 end)`,
		})
		.from(domiaRegistry)

	return {
		total: row?.total ?? 0,
		online: Number(row?.online ?? 0),
		active: Number(row?.active ?? 0),
	}
}

type TelemetryRow = {
	sourceDomiaKey: string
	inputType: string | null
	responseType: string | null
	sttMs: number | null
	llmMs: number | null
	ttfaMs: number | null
	sttExecutorKey: string | null
	llmExecutorKey: string | null
	ttsExecutorKey: string | null
	createdAt: string
}

const latencyFields = (r: TelemetryRow) => ({
	sttMs: r.sttMs,
	llmMs: r.llmMs,
	ttfaMs: r.ttfaMs,
	llmExecutorKey: r.llmExecutorKey,
	sourceDomiaKey: r.sourceDomiaKey,
})

const inferRole = (
	key: string,
	all: TelemetryRow[],
	delegatesAway: boolean,
	delegatedCount: number,
): DomiaRole => {
	const servesOthers = all.some(
		(r) =>
			r.sourceDomiaKey !== key &&
			(r.sttExecutorKey === key ||
				r.llmExecutorKey === key ||
				r.ttsExecutorKey === key),
	)
	if (servesOthers) return "hub"
	if (delegatesAway || delegatedCount > 0) return "thin"
	return "standalone"
}

export const getFleetTelemetry = async (): Promise<
	Record<string, FleetTelemetry>
> => {
	const [registry, interactions] = await Promise.all([
		db
			.select({
				domiaKey: domiaRegistry.domiaKey,
				configSnapshotJson: domiaRegistry.configSnapshotJson,
			})
			.from(domiaRegistry),
		db
			.select({
				sourceDomiaKey: interactionTrace.sourceDomiaKey,
				inputType: interactionTrace.inputType,
				responseType: interactionTrace.responseType,
				sttMs: interactionTrace.sttMs,
				llmMs: interactionTrace.llmMs,
				ttfaMs: interactionTrace.ttfaMs,
				sttExecutorKey: interactionTrace.sttExecutorKey,
				llmExecutorKey: interactionTrace.llmExecutorKey,
				ttsExecutorKey: interactionTrace.ttsExecutorKey,
				createdAt: interactionTrace.createdAt,
			})
			.from(interactionTrace)
			.orderBy(desc(interactionTrace.createdAt)),
	])

	const bySource = new Map<string, TelemetryRow[]>()
	for (const r of interactions) {
		const arr = bySource.get(r.sourceDomiaKey) ?? []
		arr.push(r)
		bySource.set(r.sourceDomiaKey, arr)
	}

	const out: Record<string, FleetTelemetry> = {}
	for (const reg of registry) {
		const rows = bySource.get(reg.domiaKey) ?? []
		const delegatesAway =
			parseConfigSnapshot(reg.configSnapshotJson).capabilityDelegations.length >
			0
		const delegatedCount = rows.filter((r) =>
			isDelegated(latencyFields(r)),
		).length
		const last = rows[0]
		out[reg.domiaKey] = {
			count: rows.length,
			ttfaP50: summarize(rows.map((r) => effectiveTtfa(latencyFields(r)))).p50,
			lastFlow: last ? deriveFlow(last.inputType, last.responseType) : null,
			role: inferRole(
				reg.domiaKey,
				interactions,
				delegatesAway,
				delegatedCount,
			),
			localCount: rows.length - delegatedCount,
			delegatedCount,
		}
	}
	return out
}

export const getDomiaRole = async (domiaKey: string): Promise<DomiaRole> => {
	const map = await getFleetTelemetry()
	return map[domiaKey]?.role ?? "standalone"
}

export const getFleetStatsFull = async (): Promise<FleetStatsFull> => {
	const since = Date.now() - DAY_MS
	const [base, ttfaRows, sessions] = await Promise.all([
		getFleetStats(),
		db
			.select({
				sttMs: interactionTrace.sttMs,
				llmMs: interactionTrace.llmMs,
				ttfaMs: interactionTrace.ttfaMs,
				llmExecutorKey: interactionTrace.llmExecutorKey,
				sourceDomiaKey: interactionTrace.sourceDomiaKey,
				createdAt: interactionTrace.createdAt,
			})
			.from(interactionTrace),
		db
			.select({ value: count() })
			.from(interactionSessionTrace)
			.where(
				gte(
					interactionSessionTrace.lastUsedAt,
					toSqliteTs(Date.now() - ACTIVE_SESSION_WINDOW_MS),
				),
			),
	])

	const volume24h = ttfaRows.filter((r) => {
		const d = fromSqliteTs(r.createdAt)
		return d != null && d.getTime() >= since
	}).length

	return {
		...base,
		activeSessions: sessions[0]?.value ?? 0,
		ttfaP50: summarize(ttfaRows.map((r) => effectiveTtfa(r))).p50,
		volume24h,
	}
}

export const listFleet = async (
	params: TableParams,
): Promise<Paginated<FleetRow>> => {
	const [page, telemetry] = await Promise.all([
		listDomias(params),
		getFleetTelemetry(),
	])
	return {
		rows: page.rows.map((r) => ({
			...r,
			telemetry: telemetry[r.domiaKey] ?? null,
		})),
		total: page.total,
	}
}
