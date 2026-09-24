import type { DomiaRegistryRow } from "@domia-app/db"
import type { DomiaConfig } from "@/types"
import type { MeshEdge, OverviewStats } from "@/types"
import type { FlowKey } from "@/types/conversations"
import type { LiveNode } from "@/types/live"
import type { PresenceStatus } from "@/types/rooms"
import type { MeshEdge as MeshTopologyEdge } from "@/types/mesh"
import type {
	LatencySummary,
	StagePerfRow,
	TimeBucketRow,
	WaterfallData,
} from "@/types/analytics"

export type OverviewLeanRow = {
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

export type FleetTelemetryRow = {
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

export type DomiaRole = "hub" | "thin" | "standalone"

export type FleetTelemetry = {
	count: number
	ttfaP50: number | null
	lastFlow: FlowKey | null
	role: DomiaRole
	localCount: number
	delegatedCount: number
}

export type MeshDomiaRow = DomiaRegistryRow & { config: DomiaConfig }

export type FleetRow = MeshDomiaRow & { telemetry: FleetTelemetry | null }

export type PresenceAvailability = "ok" | "unavailable"

export type FleetPresence = {
	nodes: LiveNode[]
	statusByKey: Record<string, PresenceStatus>
	status: PresenceAvailability
}

export type FleetGraphIdentity = {
	domiaKey: string
	name: string
	avatarId: string | null
	isPrincipal: boolean
	role: DomiaRole
	caps: { stt: boolean; llm: boolean; tts: boolean }
	online: boolean
	count: number
	ttfaP50: number | null
	status: PresenceStatus | null
}

export type FleetGraphNode = {
	nodeId: string
	name: string
	localIp: string
	httpPort: number
	online: boolean
	active: boolean | null
	identities: FleetGraphIdentity[]
}

export type FleetGraph = {
	nodes: FleetGraphNode[]
	edges: MeshTopologyEdge[]
	presence: PresenceAvailability
}

export type MeshMapNode = {
	row: MeshDomiaRow
	x: number
	y: number
	isHub: boolean
}

export type MeshMapProps = {
	rows: MeshDomiaRow[]
	edges: MeshEdge[]
	hubKey: string | null
	selectedKey?: string
	onSelect?: (key: string) => void
}

export type DomiaRecentRow = {
	id: string
	input: string
	reply: string | null
	flow: FlowKey
	ttfaMs: number | null
	createdAt: string
}

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
	rows: MeshDomiaRow[]
	edges: MeshEdge[]
	hubDomiaKey: string | null
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
	isHosted: boolean
}

export type TopologyGraphProps = {
	graph: FleetGraph
}

export type TopologyNodeProps = {
	node: FleetGraphNode
	statusOf: (domiaKey: string) => PresenceStatus | null
	onSelectNode: (nodeId: string) => void
	onSelectIdentity: (domiaKey: string) => void
	onHover: (nodeId: string | null) => void
}
