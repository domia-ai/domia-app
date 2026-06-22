import mqtt from "mqtt"

import { env } from "@/config"
import { closeDb } from "@/db"
import { handleHeartbeatMessage } from "@/handlers/heartbeat"
import { handleOfflineMessage } from "@/handlers/offline"
import { reconcileRosters } from "@/services/reconcile"
import { collectorLogger, mqttLogger, registryLogger } from "@/utils"

const HEARTBEAT_TOPIC = `${env.MQTT_TOPIC_ROOT}/+/LOCAL/heartbeat`
const OFFLINE_TOPIC = `${env.MQTT_TOPIC_ROOT}/+/LOCAL/offline`
const FORCE_EXIT_MS = 5000

process.on("uncaughtException", (err) => {
	collectorLogger.error("uncaughtException — exiting", err)
	process.exit(1)
})

process.on("unhandledRejection", (reason) => {
	collectorLogger.error("unhandledRejection", reason)
})

const main = () => {
	const client = mqtt.connect(env.MQTT_URL, {
		username: env.MQTT_USERNAME,
		password: env.MQTT_PASSWORD,
		reconnectPeriod: 3000,
	})

	client.on("connect", () => {
		collectorLogger.success(`connected to ${env.MQTT_URL}`)
		client.subscribe([HEARTBEAT_TOPIC, OFFLINE_TOPIC], (err) => {
			if (err) mqttLogger.error("subscribe failed", err)
			else mqttLogger.info(`subscribed to ${HEARTBEAT_TOPIC}, ${OFFLINE_TOPIC}`)
		})
	})

	client.on("message", (topic, payload) =>
		topic.endsWith("/offline")
			? handleOfflineMessage(payload)
			: handleHeartbeatMessage(payload),
	)
	client.on("error", (err) => mqttLogger.error("mqtt error", err.message))

	const reconcileTimer = setInterval(() => {
		void reconcileRosters().catch((err) =>
			registryLogger.error("reconcile failed", err),
		)
	}, env.DOMIA_APP_RECONCILE_INTERVAL_MS)
	reconcileTimer.unref()

	let shuttingDown = false
	const shutdown = (signal: string) => {
		if (shuttingDown) return
		shuttingDown = true
		collectorLogger.info(`${signal} received — shutting down`)
		const force = setTimeout(() => process.exit(1), FORCE_EXIT_MS)
		force.unref()
		client.end(false, {}, () => {
			closeDb()
			clearTimeout(force)
			collectorLogger.info("shutdown complete")
			process.exit(0)
		})
	}

	process.on("SIGINT", () => shutdown("SIGINT"))
	process.on("SIGTERM", () => shutdown("SIGTERM"))
}

main()
