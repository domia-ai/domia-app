import { getNodeEndpoint } from "@/services/fleet"
import {
	nodeSpeak,
	nodeAnnounceAudio,
	nodeIntercom,
	nodeCancelTurn,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { IntercomResult } from "@/types/rooms"

const baseFor = async (domiaKey: string): Promise<string | null> => {
	const endpoint = await getNodeEndpoint(domiaKey)
	if (!endpoint) return null
	return `http://${endpoint.localIp}:${endpoint.httpPort}`
}

export const announceToDomia = async (
	domiaKey: string,
	text: string,
	broadcastId?: string,
): Promise<ActionResult<{ delivered: boolean; target?: string }>> => {
	try {
		const base = await baseFor(domiaKey)
		if (!base)
			return { ok: false, error: "This Domia has no reachable address" }
		const res = await nodeSpeak(base, { domiaKey, text, broadcastId })
		const delivered = Array.isArray(res.delivered)
			? res.delivered.length > 0
			: !!res.delivered
		return { ok: true, data: { delivered, target: res.target } }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Announce failed",
		}
	}
}

export const announceAudioToDomia = async (
	domiaKey: string,
	audioBase64: string,
	mode: "voice" | "transcribe",
	broadcastId?: string,
): Promise<
	ActionResult<{ delivered: boolean; target?: string; transcript?: string }>
> => {
	try {
		const base = await baseFor(domiaKey)
		if (!base)
			return { ok: false, error: "This Domia has no reachable address" }
		const res = await nodeAnnounceAudio(base, {
			domiaKey,
			audioBase64,
			mode,
			broadcastId,
		})
		return {
			ok: true,
			data: {
				delivered: !!res.delivered,
				target: res.target,
				transcript: res.transcript,
			},
		}
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Announce failed",
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
