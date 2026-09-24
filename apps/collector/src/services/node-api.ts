import { syncResponseSchema } from "@/schemas"
import { env } from "@/config"
import { meshHeaders, withRetry } from "@/utils"
import type {
	AudioKind,
	DomiaSnapshot,
	SyncCursors,
	SyncKeysetStream,
	SyncResponse,
} from "@/types"

const CURSOR_PARAMS: Record<SyncKeysetStream, { since: string; id: string }> = {
	turn: { since: "turnSince", id: "turnId" },
	facts: { since: "factsSince", id: "factsId" },
	tool: { since: "toolSince", id: "toolId" },
	episode: { since: "episodeSince", id: "episodeId" },
	knowledge: { since: "knowledgeSince", id: "knowledgeId" },
	voiceFeel: { since: "voiceFeelSince", id: "voiceFeelId" },
	evidence: { since: "evidenceSince", id: "evidenceId" },
}

const baseUrl = (snapshot: DomiaSnapshot): string | null => {
	if (!snapshot.localIp || !snapshot.httpPort) return null
	const scheme = snapshot.httpScheme ?? "http"
	return `${scheme}://${snapshot.localIp}:${snapshot.httpPort}`
}

const syncQuery = (
	snapshot: DomiaSnapshot,
	cursors: SyncCursors,
	limit: number,
): string => {
	const params = new URLSearchParams({
		since: cursors.interaction,
		limit: String(limit),
		domiaKey: snapshot.domiaKey,
	})
	for (const [stream, names] of Object.entries(CURSOR_PARAMS)) {
		const cursor = cursors[stream as SyncKeysetStream]
		params.set(names.since, cursor.since)
		params.set(names.id, cursor.id)
	}
	return params.toString()
}

export const fetchSync = async (
	snapshot: DomiaSnapshot,
	cursors: SyncCursors,
	limit: number,
): Promise<SyncResponse | null> => {
	const base = baseUrl(snapshot)
	if (!base) return null
	const url = `${base}/sync?${syncQuery(snapshot, cursors, limit)}`
	return withRetry(async () => {
		const res = await fetch(url, {
			headers: meshHeaders(),
			signal: AbortSignal.timeout(10_000),
		})
		if (!res.ok) throw new Error(`sync ${res.status} for ${snapshot.domiaKey}`)
		return syncResponseSchema.parse(await res.json()) as SyncResponse
	})
}

export const fetchAudio = async (
	snapshot: DomiaSnapshot,
	interactionId: string,
	kind: AudioKind,
): Promise<Buffer | null> => {
	const base = baseUrl(snapshot)
	if (!base) return null
	const url = `${base}/audio/${interactionId}?kind=${kind}`
	const max = env.DOMIA_APP_MAX_AUDIO_BYTES
	return withRetry(async () => {
		const res = await fetch(url, {
			headers: meshHeaders(),
			signal: AbortSignal.timeout(10_000),
		})
		if (res.status === 404) return null
		if (!res.ok) throw new Error(`audio ${res.status} for ${interactionId}`)
		const declared = Number(res.headers.get("content-length"))
		if (Number.isFinite(declared) && declared > max) {
			throw new Error(`audio exceeds ${max} bytes (declared ${declared})`)
		}
		const buf = Buffer.from(await res.arrayBuffer())
		if (buf.length > max) {
			throw new Error(`audio exceeds ${max} bytes (got ${buf.length})`)
		}
		return buf
	})
}
