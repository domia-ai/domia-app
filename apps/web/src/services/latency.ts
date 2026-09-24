import { resolveNodeBase } from "@/services/fleet"
import {
	nodeGetInteraction,
	nodeGetLatencyStats,
	nodeListSatellites,
} from "@/lib/node-client"
import { toPerceivedSource } from "@/utils/latency"
import { LATENCY_STAGES } from "@/constants/latency"
import { nodeFailure } from "@/utils/service-errors"
import type { ActionResult } from "@/types"
import type { BoundSatelliteRow } from "@/types/satellites"
import type {
	InteractionLadderInput,
	LatencyPercentiles,
	LatencySatelliteRow,
	LatencyStageKey,
	LatencyStatsSummary,
	LatencyStatsView,
	NodeLatencyStats,
	PerceivedLatencySource,
} from "@/types/latency"

const toPercentiles = (raw: NodeLatencyStats["ttfa"]): LatencyPercentiles => ({
	count: raw.count,
	p50: raw.p50 ?? null,
	p90: raw.p90 ?? null,
	min: raw.min ?? null,
	max: raw.max ?? null,
})

const summarize = (stats: NodeLatencyStats): LatencyStatsSummary => ({
	sampleSize: stats.sampleSize,
	stages: Object.fromEntries(
		LATENCY_STAGES.map((stage) => [stage.key, toPercentiles(stats[stage.key])]),
	) as Record<LatencyStageKey, LatencyPercentiles>,
	speculation: {
		handedOff: stats.speculation.handedOff,
		wastedFirstUnit: stats.speculation.wastedFirstUnit,
		discarded: stats.speculation.discarded,
		wasteRate: stats.speculation.wasteRate,
	},
	bargeIn: {
		resumed: stats.bargeIn.resumed,
		escalated: stats.bargeIn.escalated,
		recoveryRate: stats.bargeIn.recoveryRate,
	},
	twoTier: {
		prefills: stats.twoTier.prefills,
		cancelled: stats.twoTier.cancelled,
		reused: stats.twoTier.reused,
		reprefilled: stats.twoTier.reprefilled,
	},
	wakeVerifier: {
		accepted: stats.wakeVerifier.accepted,
		rejected: stats.wakeVerifier.rejected,
		failedOpen: stats.wakeVerifier.failedOpen,
		rejectRate: stats.wakeVerifier.rejectRate,
	},
})

export const getLatencyStats = async (
	domiaKey: string,
): Promise<ActionResult<LatencyStatsView>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const [stats, satellites] = await Promise.all([
			nodeGetLatencyStats(base.data, domiaKey),
			nodeListSatellites(base.data, domiaKey)
				.then((res) => res.satellites)
				.catch((): BoundSatelliteRow[] => []),
		])
		const nameById = new Map(
			satellites.map((sat) => [sat.satelliteId, sat.name ?? sat.satelliteId]),
		)
		const rows: LatencySatelliteRow[] = Object.entries(stats.bySatellite)
			.map(([satelliteId, percentiles]) => ({
				satelliteId,
				name: nameById.get(satelliteId) ?? satelliteId,
				percentiles: toPercentiles(percentiles),
			}))
			.sort((a, b) => b.percentiles.count - a.percentiles.count)
		return { ok: true, data: { stats: summarize(stats), satellites: rows } }
	} catch (err) {
		return nodeFailure(err, "Could not read node metrics")
	}
}

export const getInteractionLadder = async ({
	domiaKey,
	interactionId,
}: InteractionLadderInput): Promise<ActionResult<PerceivedLatencySource>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { interaction } = await nodeGetInteraction(
			base.data,
			domiaKey,
			interactionId,
		)
		return { ok: true, data: toPerceivedSource(interaction) }
	} catch (err) {
		return nodeFailure(err, "Could not read the live interaction")
	}
}
