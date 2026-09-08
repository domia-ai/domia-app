export type SkillProviderStatus = {
	id: string
	name: string
	kind: string | null
	connected: boolean
	cachedTools: number
	allowedTools: number
	lastSyncAt: string | null
	specialization: Record<string, string | number | boolean | null> | null
}

export type SkillsStatusResult = {
	skillsEngine: boolean
	providers: SkillProviderStatus[]
}

export type DiscoveredSkillProvider = {
	kind: string
	name: string
	url: string
	host: string
	port: number
	version: string | null
}

export type DiscoverSkillProvidersResult = {
	providers: DiscoveredSkillProvider[]
}
