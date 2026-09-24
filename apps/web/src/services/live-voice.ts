import { getNodeEndpoint } from "@/services/fleet"
import { nodeMintSatelliteToken } from "@/lib/node-client"
import { nodeBaseUrl, nodeWsUrl } from "@/utils/node-base"
import type { ActionResult } from "@/types"
import type { LiveVoiceGrant, LiveVoiceTokenInput } from "@/types/live"

const LIVE_SATELLITE_PATH = "/satellite?live=1"

export const mintLiveVoiceToken = async (
	input: LiveVoiceTokenInput,
): Promise<ActionResult<LiveVoiceGrant>> => {
	const endpoint = await getNodeEndpoint(input.domiaKey)
	if (!endpoint)
		return { ok: false, error: "This Domia has no reachable address" }
	try {
		const grant = await nodeMintSatelliteToken(nodeBaseUrl(endpoint), input)
		return {
			ok: true,
			data: {
				...grant,
				wsUrl: nodeWsUrl(endpoint, LIVE_SATELLITE_PATH),
				domiaKey: input.domiaKey,
				satelliteId: input.satelliteId,
			},
		}
	} catch (err) {
		return {
			ok: false,
			error:
				err instanceof Error ? err.message : "Could not start a live session",
		}
	}
}
