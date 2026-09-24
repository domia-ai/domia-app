import type { BoundedIntRule } from "@/types/config"

export type IdentityRole = "principal" | "hosted" | "peer"

export type HttpScheme = "http" | "https"

export type NodeEndpoint = {
	localIp: string
	httpPort: number
	httpScheme: HttpScheme
}

export type NodeIdentity = {
	domiaKey: string
	name: string
	isHosted: boolean
	isPrincipal: boolean
	role: IdentityRole
}

export type CreateIdentityResult = {
	identity: { domiaKey: string; name: string }
	restored?: boolean
}

export type RemoveIdentityResult = {
	removed: boolean
}

export type CreateIdentityBody = {
	name: string
	domiaKey?: string
}

export type CreatedIdentity = NodeIdentity & {
	restored: boolean
}

export type CreateIdentityInput = {
	anchorDomiaKey: string
	name: string
	domiaKey?: string
}

export type IdentitiesResult = {
	identities: NodeIdentity[]
}

export type RestartResult = {
	restarting: boolean
}

export type NodeIdentitySummary = {
	domiaKey: string
	name: string
	avatarId: string | null
	isHosted: boolean
	isPrincipal: boolean
	role: IdentityRole
	online: boolean
	lastSeenAt: number | null
}

export type NodeSummary = {
	nodeId: string
	localIp: string
	httpPort: number
	httpScheme: HttpScheme
	online: boolean
	hostedCount: number
	peerCount: number
	principalName: string | null
	identities: NodeIdentitySummary[]
}

export type NodeDetail = NodeSummary & {
	hosted: NodeIdentitySummary[]
	peers: NodeIdentitySummary[]
}

export type NodeHealth = {
	status: string
	timestamp: string
}

export type NodeProbeInput = {
	host: string
	port: number
	scheme: HttpScheme
}

export type NodeProbeResult = {
	host: string
	port: number
	scheme: HttpScheme
	health: NodeHealth
	identities: NodeIdentity[]
}

export type AddNodeResult = {
	nodeId: string
	domiaKey: string
	identities: NodeIdentity[]
}

export type NodeConfigSection = {
	meshControlToleranceMs: number
	meshDropWarnWindowMs: number
	modelDownloadTimeoutMs: number
	modelInstallMaxBytes: number
	modelInstallMaxRedirects: number
	modelInstallMaxConcurrentJobs: number
	modelJobRetentionMs: number
	publicAudioBaseUrl: string | null
}

export type NodeConfigNumericKey = Exclude<
	keyof NodeConfigSection,
	"publicAudioBaseUrl"
>

export type NodeConfigNumericField = BoundedIntRule & {
	key: NodeConfigNumericKey
	label: string
	hint: string
	unit: string
}

export type NodeConfigSnapshot = {
	version: number
	revision: number
	node: NodeConfigSection
}

export type NodeConfigApplyResult = {
	applied: boolean
	revision: number
	changed: string[]
	reloaded: string[]
}

export type NodeConfigUpdateInput = {
	anchorDomiaKey: string
	node: Partial<NodeConfigSection>
}
