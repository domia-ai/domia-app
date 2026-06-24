export type PresenceStatus = "idle" | "listening" | "thinking" | "speaking"

export type SatelliteProtocol = "native" | "wyoming" | "esphome"

export type SatelliteWakeWordInfo = {
	id: string
	wakeWord: string
}

export type SatelliteNumberEntity = {
	id: string
	name: string
	value: number | null
	min: number | null
	max: number | null
	step: number | null
	unit: string | null
}

export type SatellitePresence = {
	satelliteId: string
	protocol: SatelliteProtocol
	connected: boolean
	connecting: boolean
	connectedAt: number | null
	lastError: string | null
	lastErrorAt: number | null
	reconnectCount?: number
	micActive?: boolean
	sampleRate?: number | null
	lastTurnAt?: number | null
	lastPlaybackAt?: number | null
	availableWakeWords?: SatelliteWakeWordInfo[]
	activeWakeWords?: string[]
	numberEntities?: SatelliteNumberEntity[]
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
