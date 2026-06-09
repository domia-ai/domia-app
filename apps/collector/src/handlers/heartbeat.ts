import { upsertHeartbeat } from "@/services/registry"
import { ingestFrom } from "@/services/ingestion"
import { domiaSnapshotSchema } from "@/schemas"
import { collectorLogger, ingestionLogger, mqttLogger } from "@/utils"

export const handleHeartbeatMessage = (payload: Buffer) => {
	try {
		const parsed = domiaSnapshotSchema.safeParse(JSON.parse(payload.toString()))
		if (!parsed.success) {
			mqttLogger.warn(`invalid heartbeat: ${parsed.error.message}`)
			return
		}

		const snapshot = parsed.data
		upsertHeartbeat(snapshot)
		void ingestFrom(snapshot).catch((err) =>
			ingestionLogger.error(`ingest failed for ${snapshot.domiaKey}`, err),
		)
	} catch (err) {
		collectorLogger.error("bad heartbeat payload", err)
	}
}
