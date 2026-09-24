import { mkdirSync, writeFileSync } from "node:fs"
import { join, resolve, sep } from "node:path"
import dbAdapter from "@/db/adapter"
import { env } from "@/config"
import { fetchSync, fetchAudio } from "@/services/node-api"
import { ingestionLogger } from "@/utils"
import type {
	AudioKind,
	DomiaSnapshot,
	NodeInteraction,
	NodeAnnouncement,
	SyncCursors,
	SyncStreamDescriptor,
} from "@/types"

const SYNC_LIMIT = env.DOMIA_APP_SYNC_PAGE_SIZE
const MAX_PAGES = env.DOMIA_APP_SYNC_MAX_PAGES
const SLOW_STREAM_SWEEP_MS = env.DOMIA_APP_SLOW_STREAM_SWEEP_MS

const KEYSET_STREAMS: readonly SyncStreamDescriptor[] = [
	{
		stream: "turn",
		rows: (d) => d.turnEvents.length,
		next: (d) => d.nextTurnCursor,
	},
	{
		stream: "facts",
		rows: (d) => d.facts.length,
		next: (d) => d.nextFactsCursor,
	},
	{
		stream: "tool",
		rows: (d) => d.toolRuns.length,
		next: (d) => d.nextToolCursor,
	},
	{
		stream: "episode",
		rows: (d) => d.memoryEpisodes.length,
		next: (d) => d.nextEpisodeCursor,
	},
	{
		stream: "knowledge",
		rows: (d) => d.knowledgeEntries.length,
		next: (d) => d.nextKnowledgeCursor,
	},
	{
		stream: "voiceFeel",
		rows: (d) => d.voiceFeelAdjustments.length,
		next: (d) => d.nextVoiceFeelCursor,
	},
	{
		stream: "evidence",
		rows: (d) => d.factEvidence.length,
		next: (d) => d.nextEvidenceCursor,
	},
]
const AUDIO_DIR = resolve(env.DOMIA_APP_AUDIO_DIR)
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/
const WAV_HEADER_BYTES = 44

const safeSegment = (value: string, label: string): string => {
	if (value === "." || value === ".." || !SAFE_SEGMENT.test(value)) {
		throw new Error(`unsafe ${label}: "${value}"`)
	}
	return value
}

const inFlight = new Set<string>()

const archiveAudio = async (
	snapshot: DomiaSnapshot,
	interactionId: string,
	kind: AudioKind,
) => {
	const id = `${snapshot.domiaKey}__${interactionId}__${kind}`
	if (dbAdapter.hasAudio(id)) return
	const safeKey = safeSegment(snapshot.domiaKey, "domiaKey")
	const safeId = safeSegment(interactionId, "interactionId")
	const buf = await fetchAudio(snapshot, interactionId, kind)
	if (!buf || buf.length <= WAV_HEADER_BYTES) return
	const dir = join(AUDIO_DIR, safeKey, kind)
	const localPath = join(dir, `${safeId}.wav`)
	if (!resolve(localPath).startsWith(AUDIO_DIR + sep)) {
		throw new Error(`path escapes audio dir: ${localPath}`)
	}
	mkdirSync(dir, { recursive: true })
	writeFileSync(localPath, buf)
	dbAdapter.insertAudio({
		id,
		sourceDomiaKey: snapshot.domiaKey,
		interactionId,
		kind,
		localPath,
		bytes: buf.length,
		createdAt: new Date().toISOString(),
	})
}

const archiveAudioSafe = async (
	snapshot: DomiaSnapshot,
	interactionId: string,
	kind: AudioKind,
) => {
	try {
		await archiveAudio(snapshot, interactionId, kind)
	} catch (err) {
		ingestionLogger.warn(
			`audio ${kind} failed for ${snapshot.domiaKey}/${interactionId}`,
			err,
		)
	}
}

const archiveAudios = async (
	snapshot: DomiaSnapshot,
	interactions: NodeInteraction[],
) => {
	for (const it of interactions) {
		if (it.ttsAudioPath) await archiveAudioSafe(snapshot, it.id, "tts")
		if (it.inputAudioPath) await archiveAudioSafe(snapshot, it.id, "input")
	}
}

const archiveAnnouncementAudios = async (
	snapshot: DomiaSnapshot,
	announcements: NodeAnnouncement[],
) => {
	for (const a of announcements) {
		if (a.audioPath) await archiveAudioSafe(snapshot, a.id, "announce")
	}
}

const AUDIO_RETRY_LIMIT = 10

const retryMissingAudio = async (snapshot: DomiaSnapshot): Promise<void> => {
	for (const kind of ["tts", "input", "announce"] as const) {
		const missing = dbAdapter.listMissingAudio(
			snapshot.domiaKey,
			kind,
			AUDIO_RETRY_LIMIT,
		)
		for (const interactionId of missing) {
			await archiveAudioSafe(snapshot, interactionId, kind)
		}
	}
}

export const ingestFrom = async (snapshot: DomiaSnapshot): Promise<void> => {
	const domiaKey = snapshot.domiaKey
	if (!domiaKey || inFlight.has(domiaKey)) return
	inFlight.add(domiaKey)
	try {
		let cursors = dbAdapter.readCursors(domiaKey)
		await retryMissingAudio(snapshot)
		const marker = snapshot.lastInteractionAt
		const turnMarker = snapshot.lastTurnAt
		const interactionsCaughtUp = !marker || marker <= cursors.interaction
		const turnsCaughtUp = !turnMarker || turnMarker <= cursors.turn.since
		const lastSyncedAt = dbAdapter.readLastSyncedAt(domiaKey)
		const sweepDue =
			!lastSyncedAt || Date.now() - lastSyncedAt >= SLOW_STREAM_SWEEP_MS
		if (interactionsCaughtUp && turnsCaughtUp && !sweepDue) return
		let total = 0

		for (let page = 0; page < MAX_PAGES; page++) {
			const data = await fetchSync(snapshot, cursors, SYNC_LIMIT)
			if (!data) break

			const counts = [
				data.interactions.length,
				data.sessions.length,
				data.emotionEvents.length,
				data.announcements.length,
				...KEYSET_STREAMS.map((s) => s.rows(data)),
			]
			const hasData = counts.some((n) => n > 0) || Boolean(data.userModel)
			if (hasData) {
				dbAdapter.mirrorSync(domiaKey, data)
				await archiveAudios(snapshot, data.interactions)
				await archiveAnnouncementAudios(snapshot, data.announcements)
				total += data.interactions.length
			}

			const pageFull = counts.some((n) => n >= SYNC_LIMIT)

			const advanced: Partial<SyncCursors> = {}
			if (data.nextCursor && data.nextCursor !== cursors.interaction) {
				advanced.interaction = data.nextCursor
			}
			for (const descriptor of KEYSET_STREAMS) {
				const next = descriptor.next(data)
				const current = cursors[descriptor.stream]
				if (!next) continue
				if (next.since === current.since && next.id === current.id) continue
				advanced[descriptor.stream] = next
			}

			const anyAdvanced = Object.keys(advanced).length > 0
			if (anyAdvanced) {
				cursors = { ...cursors, ...advanced }
				dbAdapter.writeCursors(domiaKey, advanced)
			}

			if (!anyAdvanced && pageFull) {
				ingestionLogger.warn(
					`sync cursor stalled for ${domiaKey} at "${cursors.interaction}" with a full page — aborting this run`,
				)
				break
			}

			if (!pageFull) break
		}

		if (sweepDue) dbAdapter.writeCursors(domiaKey, {})

		if (total) {
			ingestionLogger.debug(`synced ${total} interaction(s) from ${domiaKey}`)
		}
	} finally {
		inFlight.delete(domiaKey)
	}
}
