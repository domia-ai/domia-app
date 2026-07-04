import { resolveNodeBase } from "@/services/fleet"
import { listNodes } from "@/services/nodes"
import {
	nodeDiscoverSatellites,
	nodeListSatellites,
	nodeBindSatellite,
	nodeUnbindSatellite,
	nodeSetSatelliteWakeWords,
	nodeSetSatelliteNumber,
	nodeSetSatelliteFollowUp,
	nodeSetSatelliteVolume,
	nodeTestSatelliteSpeaker,
	nodePresence,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	DiscoveredSatellite,
	BoundSatellite,
	BoundSatelliteRow,
	BindSatelliteBody,
	SetWakeWordsResult,
	SetNumberResult,
	SetFollowUpResult,
	SetVolumeResult,
	TestSpeakerResult,
	SatelliteWithContext,
} from "@/types/satellites"
import type { PresenceEntry, SatelliteCapabilities } from "@/types/rooms"

const NO_CAPABILITIES: SatelliteCapabilities = {
	canHear: false,
	canSpeak: false,
	canAnnounce: false,
	canIntercom: false,
	canFollowUp: false,
}

const enrichSatellite = (
	s: BoundSatelliteRow,
	room: PresenceEntry | undefined,
): BoundSatellite => {
	const live = room?.satellites.find((x) => x.satelliteId === s.satelliteId)
	return {
		...s,
		online: !!live?.connected,
		connecting: !!live?.connecting,
		status: live?.connected ? (room?.status ?? null) : null,
		connectedAt: live?.connectedAt ?? null,
		lastActiveAt: room?.lastActiveAt ?? null,
		lastError: live?.connected ? null : (live?.lastError ?? null),
		micActive: !!live?.micActive,
		reconnectCount: live?.reconnectCount ?? 0,
		sampleRate: live?.sampleRate ?? null,
		lastTurnAt: live?.lastTurnAt ?? null,
		lastPlaybackAt: live?.lastPlaybackAt ?? null,
		availableWakeWords: live?.availableWakeWords ?? [],
		activeWakeWords: live?.activeWakeWords ?? [],
		numberEntities: live?.numberEntities ?? [],
		volume: live?.volume ?? null,
		capabilities: live?.capabilities ?? NO_CAPABILITIES,
		firmwareVersion: live?.firmwareVersion ?? null,
		recentEvents: live?.recentEvents ?? [],
	}
}

export const discoverSatellites = async (
	anchorDomiaKey: string,
): Promise<ActionResult<DiscoveredSatellite[]>> => {
	const base = await resolveNodeBase(anchorDomiaKey)
	if (!base.ok) return base
	try {
		const { satellites } = await nodeDiscoverSatellites(base.data)
		return { ok: true, data: satellites }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Discovery failed",
		}
	}
}

export const listSatellites = async (
	domiaKey: string,
): Promise<ActionResult<BoundSatellite[]>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const [{ satellites }, presence] = await Promise.all([
			nodeListSatellites(base.data, domiaKey),
			nodePresence(base.data)
				.then((r) => r.presence)
				.catch((): PresenceEntry[] => []),
		])
		const room = presence.find((p) => p.domiaKey === domiaKey)
		const merged = satellites.map((s) => enrichSatellite(s, room))
		return { ok: true, data: merged }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not list satellites",
		}
	}
}

export const listAllSatellites = async (): Promise<
	ActionResult<SatelliteWithContext[]>
> => {
	try {
		const nodes = await listNodes()
		const perNode = await Promise.all(
			nodes.map(async (n) => {
				const hosted = n.identities.filter((i) => i.isHosted)
				if (hosted.length === 0) return []
				const base = `http://${n.localIp}:${n.httpPort}`
				const presence = await nodePresence(base)
					.then((r) => r.presence)
					.catch((): PresenceEntry[] => [])
				const roomByKey = new Map(presence.map((p) => [p.domiaKey, p]))
				const lists = await Promise.all(
					hosted.map(async (h) => {
						try {
							const { satellites } = await nodeListSatellites(base, h.domiaKey)
							const room = roomByKey.get(h.domiaKey)
							return satellites.map((s) => ({
								...enrichSatellite(s, room),
								domiaKey: h.domiaKey,
								domiaName: h.name,
								avatarId: h.avatarId,
							}))
						} catch {
							return []
						}
					}),
				)
				return lists.flat()
			}),
		)
		return { ok: true, data: perNode.flat() }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not list satellites",
		}
	}
}

export const bindSatellite = async (input: {
	domiaKey: string
	satellite: BindSatelliteBody
}): Promise<ActionResult<boolean>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const { bound } = await nodeBindSatellite(
			base.data,
			input.domiaKey,
			input.satellite,
		)
		return { ok: true, data: bound }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not bind satellite",
		}
	}
}

export const unbindSatellite = async (input: {
	domiaKey: string
	satelliteId: string
}): Promise<ActionResult<boolean>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const { removed } = await nodeUnbindSatellite(
			base.data,
			input.domiaKey,
			input.satelliteId,
		)
		return { ok: true, data: removed }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not unbind satellite",
		}
	}
}

export const setSatelliteWakeWords = async (input: {
	domiaKey: string
	satelliteId: string
	wakeWords: string[]
}): Promise<ActionResult<SetWakeWordsResult>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeSetSatelliteWakeWords(
			base.data,
			input.domiaKey,
			input.satelliteId,
			input.wakeWords,
		)
		return { ok: true, data: result }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not set wake words",
		}
	}
}

export const setSatelliteNumber = async (input: {
	domiaKey: string
	satelliteId: string
	entityId: string
	value: number
}): Promise<ActionResult<SetNumberResult>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeSetSatelliteNumber(
			base.data,
			input.domiaKey,
			input.satelliteId,
			input.entityId,
			input.value,
		)
		return { ok: true, data: result }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not set value",
		}
	}
}

export const setSatelliteFollowUp = async (input: {
	domiaKey: string
	satelliteId: string
	enabled: boolean
}): Promise<ActionResult<SetFollowUpResult>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeSetSatelliteFollowUp(
			base.data,
			input.domiaKey,
			input.satelliteId,
			input.enabled,
		)
		return { ok: true, data: result }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not set follow-up",
		}
	}
}

export const setSatelliteVolume = async (input: {
	domiaKey: string
	satelliteId: string
	volume: number
}): Promise<ActionResult<SetVolumeResult>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeSetSatelliteVolume(
			base.data,
			input.domiaKey,
			input.satelliteId,
			input.volume,
		)
		return { ok: true, data: result }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not set volume",
		}
	}
}

export const testSatelliteSpeaker = async (input: {
	domiaKey: string
	satelliteId: string
}): Promise<ActionResult<TestSpeakerResult>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		const result = await nodeTestSatelliteSpeaker(
			base.data,
			input.domiaKey,
			input.satelliteId,
		)
		return { ok: true, data: result }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not test speaker",
		}
	}
}
