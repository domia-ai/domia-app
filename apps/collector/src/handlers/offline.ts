import { z } from "zod"
import { ONLINE_THRESHOLD_MS } from "@domia-app/db"

import dbAdapter from "@/db/adapter"
import { collectorLogger, mqttLogger } from "@/utils"

const offlineSchema = z.object({ nodeId: z.string().min(1) })

export const handleOfflineMessage = (payload: Buffer) => {
	try {
		const parsed = offlineSchema.safeParse(JSON.parse(payload.toString()))
		if (!parsed.success) {
			mqttLogger.warn(`invalid offline marker: ${parsed.error.message}`)
			return
		}
		const staleAt = Date.now() - ONLINE_THRESHOLD_MS - 1000
		dbAdapter.markNodeOffline(parsed.data.nodeId, staleAt)
		mqttLogger.info(`node ${parsed.data.nodeId} went offline`)
	} catch (err) {
		collectorLogger.error("bad offline payload", err)
	}
}
