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
	followUpEnabled: boolean
}

import type { SatelliteNumberEntity } from "@/types/rooms"

export type { SatelliteNumberEntity }

export type SatelliteWakeWord = {
	id: string
	wakeWord: string
}

export type BoundSatellite = BoundSatelliteRow & {
	online: boolean
	connecting: boolean
	status: string | null
	connectedAt: number | null
	lastActiveAt: number | null
	lastError: string | null
	micActive: boolean
	reconnectCount: number
	sampleRate: number | null
	lastTurnAt: number | null
	lastPlaybackAt: number | null
	availableWakeWords: SatelliteWakeWord[]
	activeWakeWords: string[]
	numberEntities: SatelliteNumberEntity[]
}

export type SetWakeWordsResult = {
	applied: boolean
	live: boolean
}

export type SetNumberResult = {
	applied: boolean
	live: boolean
}

export type SetFollowUpResult = {
	applied: boolean
	live: boolean
}

export type SatelliteNumberGroup = {
	label: string
	entities: SatelliteNumberEntity[]
}

export type TestSpeakerResult = {
	delivered: boolean
	target: string
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
