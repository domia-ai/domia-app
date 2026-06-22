import { resolveNodeBase } from "@/services/fleet"
import {
	nodeDiscoverSatellites,
	nodeListSatellites,
	nodeBindSatellite,
	nodeUnbindSatellite,
	nodePresence,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type {
	DiscoveredSatellite,
	BoundSatellite,
	BindSatelliteBody,
} from "@/types/satellites"
import type { PresenceEntry } from "@/types/rooms"

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
		const roomByKey = new Map(presence.map((p) => [p.domiaKey, p]))
		const merged: BoundSatellite[] = satellites.map((s) => {
			const room = roomByKey.get(domiaKey)
			const live = room?.satellites.find((x) => x.satelliteId === s.satelliteId)
			return {
				...s,
				online: !!live?.connected,
				connecting: !!live?.connecting,
				status: live?.connected ? (room?.status ?? null) : null,
				connectedAt: live?.connectedAt ?? null,
				lastActiveAt: room?.lastActiveAt ?? null,
				lastError: live?.connected ? null : (live?.lastError ?? null),
			}
		})
		return { ok: true, data: merged }
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
