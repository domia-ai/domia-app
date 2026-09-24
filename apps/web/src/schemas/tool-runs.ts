import { z } from "zod"

export const toolRunSchema = z.looseObject({
	id: z.string(),
	interactionId: z.string().catch(""),
	tool: z.string().catch(""),
	providerSlug: z.string().nullish().catch(null),
	routineSlug: z.string().nullish().catch(null),
	stepIndex: z.number().nullish().catch(null),
	argsHash: z.string().nullish().catch(null),
	riskClass: z.string().nullish().catch(null),
	policyDecision: z.string().nullish().catch(null),
	policySource: z.string().nullish().catch(null),
	confirmationId: z.string().nullish().catch(null),
	status: z.string().nullish().catch(null),
	durationMs: z.number().nullish().catch(null),
	spokenAt: z.string().nullish().catch(null),
	settledAt: z.string().nullish().catch(null),
	createdAt: z.string().catch(""),
})

export const toolRunsResultSchema = z.looseObject({
	toolRuns: z.array(toolRunSchema).catch([]),
})
