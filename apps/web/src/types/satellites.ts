export type DiscoveredSatellite = {
	satelliteId: string
	name: string
	host: string
	port: number
}

export type BoundSatelliteRow = {
	id: string
	satelliteId: string
	name: string | null
	host: string
	port: number
	protocol: string
	isActive: boolean
}

export type BoundSatellite = BoundSatelliteRow & {
	online: boolean
	connecting: boolean
	status: string | null
	connectedAt: number | null
	lastActiveAt: number | null
	lastError: string | null
}

export type BindSatelliteBody = {
	satelliteId: string
	name?: string
	host: string
	port?: number
	encryptionKey?: string
}

export type BindSatelliteResult = {
	bound: boolean
	restarting: boolean
}

export type UnbindSatelliteResult = {
	removed: boolean
	restarting: boolean
}
