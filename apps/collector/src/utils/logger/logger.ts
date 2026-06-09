import debug from "debug"

import { colors } from "./constants"
import type { LogLevelType, LogPrefixType } from "./types"

const isDevelopment = process.env.NODE_ENV !== "production"

const getPrefix = (namespace: string, level: LogLevelType): LogPrefixType => {
	const prefix = `[${namespace}]`
	switch (level) {
		case "error":
			return { prefix, color: colors.error }
		case "warn":
			return { prefix, color: colors.warning }
		case "info":
			return { prefix, color: colors.info }
		case "debug":
			return { prefix, color: colors.debug }
		case "success":
			return { prefix, color: colors.success }
		default:
			return { prefix, color: (text: string) => text }
	}
}

export const createLogger = (namespace: string) => {
	const debugInstance = debug(`domia-app:${namespace}`)

	const log = (
		level: LogLevelType,
		message: string,
		...args: unknown[]
	): void => {
		const { prefix, color } = getPrefix(namespace, level)
		const formatted = `${color(prefix)} ${message}`

		if (isDevelopment) {
			debugInstance(formatted, ...args)
			return
		}

		const timestamp = new Date().toISOString()
		const method =
			level === "error"
				? console.error
				: level === "warn"
					? console.warn
					: console.log
		method(`[${timestamp}] ${formatted}`, ...args)
	}

	return {
		error: (message: string, ...args: unknown[]) =>
			log("error", message, ...args),
		warn: (message: string, ...args: unknown[]) =>
			log("warn", message, ...args),
		info: (message: string, ...args: unknown[]) =>
			log("info", message, ...args),
		debug: (message: string, ...args: unknown[]) => {
			if (isDevelopment) log("debug", message, ...args)
		},
		success: (message: string, ...args: unknown[]) =>
			log("success", message, ...args),
	}
}

export const collectorLogger = createLogger("collector")
export const mqttLogger = createLogger("mqtt")
export const registryLogger = createLogger("registry")
export const ingestionLogger = createLogger("ingestion")
