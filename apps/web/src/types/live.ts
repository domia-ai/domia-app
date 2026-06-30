import type { PresenceEntry } from "./rooms"

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
