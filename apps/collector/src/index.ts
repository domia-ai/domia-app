import mqtt from "mqtt"

import { env } from "@/config"
import { closeDb } from "@/db"
import { handleHeartbeatMessage } from "@/handlers/heartbeat"
import { collectorLogger, mqttLogger } from "@/utils"

const HEARTBEAT_TOPIC = `${env.MQTT_TOPIC_ROOT}/+/LOCAL/heartbeat`
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
		client.subscribe(HEARTBEAT_TOPIC, (err) => {
			if (err) mqttLogger.error("subscribe failed", err)
			else mqttLogger.info(`subscribed to ${HEARTBEAT_TOPIC}`)
		})
	})

	client.on("message", (_topic, payload) => handleHeartbeatMessage(payload))
	client.on("error", (err) => mqttLogger.error("mqtt error", err.message))

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
