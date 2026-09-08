export type IdentityRole = "principal" | "hosted" | "peer"

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
}

export type NodeProbeResult = {
	host: string
	port: number
	health: NodeHealth
	identities: NodeIdentity[]
}

export type AddNodeResult = {
	nodeId: string
	domiaKey: string
	identities: NodeIdentity[]
}
