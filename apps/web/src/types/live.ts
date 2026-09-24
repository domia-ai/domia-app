import type { PresenceEntry } from "./rooms"

export type SatelliteTokenGrant = {
	token: string
	expiresAt: number
}

export type LiveVoiceGrant = SatelliteTokenGrant & {
	wsUrl: string
	domiaKey: string
	satelliteId: string
}

export type LiveVoiceTokenInput = {
	domiaKey: string
	satelliteId: string
}

export type LiveVoiceDownMessage =
	| { type: "ready"; domiaKey: string; name: string }
	| { type: "transcript"; text: string }
	| { type: "reply_done"; reply: string; interactionId?: string }
	| {
			type: "audio_stream_begin"
			sampleRate?: number
			channels?: number
			interactionId?: string
	  }
	| { type: "audio_stream_end" }
	| { type: "audio_pause" }
	| { type: "audio_resume" }
	| { type: "speech_stopped" }
	| { type: "error"; message: string }

export type LiveRoom = {
	domiaKey: string
	name: string
	canIntercom: boolean
	canBroadcast: boolean
}

export type IntercomControlProps = {
	hostDomiaKey: string
	rooms: LiveRoom[]
}

export type LiveNode = {
	nodeId: string
	nodeName: string
	hostDomiaKey: string
	rooms: LiveRoom[]
	entries: PresenceEntry[]
}
