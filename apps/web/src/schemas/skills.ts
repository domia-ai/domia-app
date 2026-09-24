import { z } from "zod"
import {
	SKILL_POLICY_SOURCE_VALUES,
	SKILL_RISK_CLASS_VALUES,
	SKILL_TOOL_POLICY_VALUES,
} from "@/constants/skills"

export const skillToolStatusSchema = z.looseObject({
	rawName: z.string(),
	namespacedName: z.string(),
	riskClass: z.enum(SKILL_RISK_CLASS_VALUES).nullish().catch(null),
	policy: z.enum(SKILL_TOOL_POLICY_VALUES).nullish().catch(null),
	policySource: z.enum(SKILL_POLICY_SOURCE_VALUES).nullish().catch(null),
	retryable: z.boolean().nullish().catch(null),
	openWorld: z.boolean().nullish().catch(null),
	hidden: z.boolean().nullish().catch(null),
	hintSources: z.record(z.string(), z.string()).nullish().catch(null),
})

export const skillProviderStatusSchema = z.looseObject({
	id: z.string(),
	name: z.string(),
	kind: z.string().nullish().catch(null),
	trustTier: z.string().nullish().catch(null),
	connected: z.boolean().catch(false),
	cachedTools: z.number().catch(0),
	allowedTools: z.number().catch(0),
	lastSyncAt: z.string().nullish().catch(null),
	toolsFreshUntil: z.string().nullish().catch(null),
	toolsRefreshMs: z.number().nullish().catch(null),
	protocolEra: z.string().nullish().catch(null),
	tools: z.array(skillToolStatusSchema).nullish().catch(null),
	specialization: z
		.record(
			z.string(),
			z.union([z.string(), z.number(), z.boolean(), z.null()]),
		)
		.nullish()
		.catch(null),
})

export const skillsStatusPayloadSchema = z.looseObject({
	skillsEngine: z.boolean().catch(false),
	builtinTools: z.boolean().catch(false),
	providers: z.array(skillProviderStatusSchema).default([]),
})
