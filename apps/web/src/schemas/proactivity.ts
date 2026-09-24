import { z } from "zod"

const gateReasonSchema = z
	.enum([
		"ok",
		"engine-off",
		"nudge-off",
		"quiet-hours",
		"budget-hour",
		"budget-day",
		"rate-limit",
		"no-activity",
		"idle-not-reached",
		"already-nudged",
		"busy",
		"no-delivery",
		"lease-lost",
	])
	.catch("ok")

export const proactivityStatusSchema = z.looseObject({
	domiaKey: z.string().catch(""),
	engine: z.boolean().catch(false),
	running: z.boolean().catch(false),
	busy: z.boolean().catch(false),
	quietHours: z
		.looseObject({
			start: z.string().nullish().catch(null),
			end: z.string().nullish().catch(null),
			active: z.boolean().catch(false),
		})
		.catch({ start: null, end: null, active: false }),
	budget: z
		.looseObject({
			hourUsed: z.number().catch(0),
			hourMax: z.number().catch(0),
			dayUsed: z.number().catch(0),
			dayMax: z.number().catch(0),
		})
		.catch({ hourUsed: 0, hourMax: 0, dayUsed: 0, dayMax: 0 }),
	idleNudge: z.looseObject({
		enabled: z.boolean().catch(false),
		idleAfterMs: z.number().catch(0),
		minIntervalMs: z.number().catch(0),
		lastActivityAt: z.string().nullish().catch(null),
		lastActivitySatelliteId: z.string().nullish().catch(null),
		idleForMs: z.number().nullish().catch(null),
		armed: z.boolean().catch(false),
		lastNudgeAt: z.string().nullish().catch(null),
		decision: gateReasonSchema,
	}),
	schedule: z.looseObject({
		pending: z.number().catch(0),
		leased: z.number().catch(0),
		done: z.number().catch(0),
		failed: z.number().catch(0),
		cancelled: z.number().catch(0),
		nextDueAt: z.string().nullish().catch(null),
	}),
	lastTickAt: z.string().nullish().catch(null),
	lastOutcome: z.string().nullish().catch(null),
})
