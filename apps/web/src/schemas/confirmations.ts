import { z } from "zod"

export const pendingConfirmationSchema = z.looseObject({
	scope: z.string(),
	satelliteId: z.string().nullish().catch(null),
	tool: z.string().catch(""),
	args: z.record(z.string(), z.unknown()).catch({}),
	resolvedArgs: z.record(z.string(), z.unknown()).nullish().catch(null),
	summary: z.string().nullish().catch(null),
	language: z.string().nullish().catch(null),
	reasked: z.boolean().catch(false),
	expiresAt: z.number().catch(0),
})

export const confirmationsResultSchema = z.looseObject({
	confirmations: z.array(pendingConfirmationSchema).catch([]),
})

export const settleConfirmationResultSchema = z.looseObject({
	scope: z.string().catch(""),
	decision: z.enum(["yes", "no"]).catch("no"),
	settled: z.boolean().catch(false),
	ran: z.boolean().catch(false),
	status: z.string().nullish().catch(null),
	text: z.string().nullish().catch(null),
})
