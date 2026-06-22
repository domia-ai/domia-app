export type PresenceStatus = "idle" | "listening" | "thinking" | "speaking"

export type SatelliteProtocol = "native" | "wyoming" | "esphome"

export type SatellitePresence = {
	satelliteId: string
	protocol: SatelliteProtocol
	connected: boolean
	connecting: boolean
	connectedAt: number | null
	lastError: string | null
	lastErrorAt: number | null
}

export type PresenceEntry = {
	domiaKey: string
	status: PresenceStatus
	lastActiveAt: number | null
	satellites: SatellitePresence[]
}

export type SpeakResult = {
	delivered: boolean | string[]
	target?: string
}

export type IntercomResult = {
	intercom: "started" | "stopped" | "failed"
	from: string
	to?: string
}

export type CancelTurnResult = {
	aborted: boolean
}
