import type { DomiaRegistryRow } from "@domia-app/db"
import type { MeshEdge, OverviewStats } from "@/types"
import type { FlowKey } from "@/types/conversations"
import type {
	LatencySummary,
	StagePerfRow,
	TimeBucketRow,
	WaterfallData,
} from "@/types/analytics"

export type DomiaRole = "hub" | "thin" | "standalone"

export type FleetTelemetry = {
	count: number
	ttfaP50: number | null
	lastFlow: FlowKey | null
	role: DomiaRole
	localCount: number
	delegatedCount: number
}

export type FleetRow = DomiaRegistryRow & { telemetry: FleetTelemetry | null }

export type FleetStatsFull = {
	total: number
	online: number
	active: number
	activeSessions: number
	ttfaP50: number | null
	volume24h: number
}

export type DomiaTelemetry = {
	count: number
	ttfaP50: number | null
}

export type RecentInteraction = {
	id: string
	sourceDomiaKey: string
	sourceDomiaName: string | null
	sourceDomiaAvatarId: string | null
	input: string
	reply: string | null
	flow: FlowKey
	ttfaMs: number | null
	delegated: boolean
	createdAt: string
}

export type ActivityBucket = { bucket: string; label: string; count: number }

export type OverviewActivity = {
	granularity: "hour" | "day"
	label: string
	buckets: ActivityBucket[]
}

export type OverviewPerformance = {
	s2sTtfaP50: number | null
	s2sTtfaP95: number | null
	localExecPct: number | null
	errorRate: number
	volume24h: number
	stageAvg: { stt: number; llm: number; tts: number }
	trend: TimeBucketRow[]
	activity: OverviewActivity
}

export type OverviewData = {
	rows: DomiaRegistryRow[]
	edges: MeshEdge[]
	stats: OverviewStats
	performance: OverviewPerformance
	recent: RecentInteraction[]
	telemetry: Record<string, DomiaTelemetry>
}

export type DomiaPerformance = {
	count: number
	ttfa: LatencySummary
	total: LatencySummary
	waterfall: WaterfallData | null
	execution: {
		localCount: number
		delegatedCount: number
		localP50: number | null
		delegatedP50: number | null
	}
	trend: TimeBucketRow[]
	topModels: StagePerfRow[]
}

export type DomiaTarget = {
	domiaKey: string
	name: string
	online: boolean
}
