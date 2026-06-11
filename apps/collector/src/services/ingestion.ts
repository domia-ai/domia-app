import { mkdirSync, writeFileSync } from "node:fs"
import { join, resolve, sep } from "node:path"
import dbAdapter from "@/db/adapter"
import { env } from "@/config"
import { fetchSync, fetchAudio } from "@/services/node-api"
import { ingestionLogger } from "@/utils"
import type { AudioKind, DomiaSnapshot, NodeInteraction } from "@/types"

const SYNC_LIMIT = env.DOMIA_APP_SYNC_PAGE_SIZE
const MAX_PAGES = env.DOMIA_APP_SYNC_MAX_PAGES
const AUDIO_DIR = resolve(env.DOMIA_APP_AUDIO_DIR)
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

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
	if (!buf) return
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

const AUDIO_RETRY_LIMIT = 10

const retryMissingAudio = async (snapshot: DomiaSnapshot): Promise<void> => {
	for (const kind of ["tts", "input"] as const) {
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
		let cursor = dbAdapter.readCursor(domiaKey)
		await retryMissingAudio(snapshot)
		const marker = snapshot.lastInteractionAt
		if (!marker || marker <= cursor) return
		let total = 0

		for (let page = 0; page < MAX_PAGES; page++) {
			const data = await fetchSync(snapshot, cursor, SYNC_LIMIT)
			if (!data) break

			const hasData =
				data.interactions.length > 0 ||
				data.emotionEvents.length > 0 ||
				data.facts.length > 0 ||
				data.sessions.length > 0
			if (hasData) {
				dbAdapter.mirrorSync(domiaKey, data)
				await archiveAudios(snapshot, data.interactions)
				total += data.interactions.length
			}

			const pageFull =
				data.interactions.length >= SYNC_LIMIT ||
				data.sessions.length >= SYNC_LIMIT ||
				data.emotionEvents.length >= SYNC_LIMIT ||
				data.facts.length >= SYNC_LIMIT

			if (data.nextCursor && data.nextCursor !== cursor) {
				cursor = data.nextCursor
				dbAdapter.writeCursor(domiaKey, cursor)
			} else if (pageFull) {
				ingestionLogger.warn(
					`sync cursor stalled for ${domiaKey} at "${cursor}" with a full page — aborting this run`,
				)
				break
			}

			if (!pageFull) break
		}

		if (total) {
			ingestionLogger.debug(`synced ${total} interaction(s) from ${domiaKey}`)
		}
	} finally {
		inFlight.delete(domiaKey)
	}
}
