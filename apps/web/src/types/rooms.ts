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

export type SatelliteCapabilities = {
	canHear: boolean
	canSpeak: boolean
	canAnnounce: boolean
	canIntercom: boolean
	canFollowUp: boolean
}

export type SatelliteEvent = {
	id: string
	kind: string
	detail: string
	at: number
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
	volume?: number | null
	capabilities?: SatelliteCapabilities
	firmwareVersion?: string | null
	recentEvents?: SatelliteEvent[]
}

export type PresenceEntry = {
	domiaKey: string
	status: PresenceStatus
	lastActiveAt: number | null
	satellites: SatellitePresence[]
	canIntercom?: boolean
	canBroadcast?: boolean
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

export type PresenceListResult = {
	presence: PresenceEntry[]
}

export type SpeakBody = {
	domiaKey?: string
	broadcast?: boolean
	active?: boolean
	text: string
	broadcastId?: string
}

export type AnnounceAudioBody = {
	domiaKey?: string
	audioBase64: string
	mode: "voice" | "transcribe"
	broadcastId?: string
}

export type AnnounceAudioResult = {
	mode: "voice" | "transcribe"
	delivered: boolean
	target?: string
	transcript?: string
}

export type AnnounceAudioActionResult = Omit<AnnounceAudioResult, "mode">

export type IntercomBody = {
	from: string
	to?: string
	stop?: boolean
}

export type CancelTurnBody = {
	domiaKey: string
}
