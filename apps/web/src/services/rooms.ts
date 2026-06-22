import { getNodeEndpoint } from "@/services/fleet"
import {
	nodePresence,
	nodeSpeak,
	nodeIntercom,
	nodeCancelTurn,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { PresenceEntry, IntercomResult } from "@/types/rooms"

const baseFor = async (domiaKey: string): Promise<string | null> => {
	const endpoint = await getNodeEndpoint(domiaKey)
	if (!endpoint) return null
	return `http://${endpoint.localIp}:${endpoint.httpPort}`
}

export const getRoomPresence = async (
	domiaKey: string,
): Promise<ActionResult<PresenceEntry[]>> => {
	try {
		const base = await baseFor(domiaKey)
		if (!base) return { ok: false, error: "Host has no reachable address" }
		const { presence } = await nodePresence(base)
		return { ok: true, data: presence }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Presence failed",
		}
	}
}

export const broadcastToRooms = async (
	hostDomiaKey: string,
	text: string,
): Promise<ActionResult<{ delivered: string[] }>> => {
	try {
		const base = await baseFor(hostDomiaKey)
		if (!base) return { ok: false, error: "Host has no reachable address" }
		const res = await nodeSpeak(base, { broadcast: true, text })
		const delivered = Array.isArray(res.delivered) ? res.delivered : []
		return { ok: true, data: { delivered } }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Broadcast failed",
		}
	}
}

export const cancelRoomTurn = async (
	hostDomiaKey: string,
	domiaKey: string,
): Promise<ActionResult<{ aborted: boolean }>> => {
	try {
		const base = await baseFor(hostDomiaKey)
		if (!base) return { ok: false, error: "Host has no reachable address" }
		const res = await nodeCancelTurn(base, { domiaKey })
		return { ok: true, data: { aborted: res.aborted } }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Stop failed",
		}
	}
}

export const setRoomIntercom = async (
	hostDomiaKey: string,
	from: string,
	to: string | null,
): Promise<ActionResult<IntercomResult>> => {
	try {
		const base = await baseFor(hostDomiaKey)
		if (!base) return { ok: false, error: "Host has no reachable address" }
		const res = to
			? await nodeIntercom(base, { from, to })
			: await nodeIntercom(base, { from, stop: true })
		return { ok: true, data: res }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Intercom failed",
		}
	}
}
