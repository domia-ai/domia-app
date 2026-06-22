import type { PresenceEntry } from "./rooms"

export type LiveRoom = {
	domiaKey: string
	name: string
}

export type LiveNode = {
	nodeId: string
	nodeName: string
	hostDomiaKey: string
	rooms: LiveRoom[]
	entries: PresenceEntry[]
}
