export type MeshCapability = "STT" | "LLM" | "TTS"

export type MeshIdentity = {
	domiaKey: string
	name: string
	isPrincipal: boolean
	caps: { stt: boolean; llm: boolean; tts: boolean }
}

export type MeshNode = {
	nodeId: string
	nodeName: string
	identities: MeshIdentity[]
}

export type MeshEdge = {
	from: string
	to: string
	capability: MeshCapability
	count: number
	crossHost: boolean
}

export type MeshTopology = {
	nodes: MeshNode[]
	edges: MeshEdge[]
}
