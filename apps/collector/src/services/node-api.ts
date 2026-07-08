import { syncResponseSchema } from "@/schemas"
import { env } from "@/config"
import { meshHeaders } from "@/utils"
import type { AudioKind, DomiaSnapshot, SyncResponse } from "@/types"

const baseUrl = (snapshot: DomiaSnapshot): string | null => {
	if (!snapshot.localIp || !snapshot.httpPort) return null
	return `http://${snapshot.localIp}:${snapshot.httpPort}`
}

export const fetchSync = async (
	snapshot: DomiaSnapshot,
	since: string,
	turnCursor: { since: string; id: string },
	limit: number,
): Promise<SyncResponse | null> => {
	const base = baseUrl(snapshot)
	if (!base) return null
	const url = `${base}/sync?since=${encodeURIComponent(since)}&turnSince=${encodeURIComponent(turnCursor.since)}&turnId=${encodeURIComponent(turnCursor.id)}&limit=${limit}&domiaKey=${encodeURIComponent(snapshot.domiaKey)}`
	const res = await fetch(url, {
		headers: meshHeaders(),
		signal: AbortSignal.timeout(10_000),
	})
	if (!res.ok) throw new Error(`sync ${res.status} for ${snapshot.domiaKey}`)
	return syncResponseSchema.parse(await res.json()) as SyncResponse
}

export const fetchAudio = async (
	snapshot: DomiaSnapshot,
	interactionId: string,
	kind: AudioKind,
): Promise<Buffer | null> => {
	const base = baseUrl(snapshot)
	if (!base) return null
	const url = `${base}/audio/${interactionId}?kind=${kind}`
	const res = await fetch(url, {
		headers: meshHeaders(),
		signal: AbortSignal.timeout(10_000),
	})
	if (!res.ok) return null
	const max = env.DOMIA_APP_MAX_AUDIO_BYTES
	const declared = Number(res.headers.get("content-length"))
	if (Number.isFinite(declared) && declared > max) {
		throw new Error(`audio exceeds ${max} bytes (declared ${declared})`)
	}
	const buf = Buffer.from(await res.arrayBuffer())
	if (buf.length > max) {
		throw new Error(`audio exceeds ${max} bytes (got ${buf.length})`)
	}
	return buf
}
