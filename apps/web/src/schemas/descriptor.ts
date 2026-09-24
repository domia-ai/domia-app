import { z } from "zod"
import {
	DESCRIPTOR_DEFAULT_LIMITS,
	SKILL_ARG_NORMALIZE_OP_VALUES,
	SKILL_FINALIZE_MODE_VALUES,
	SKILL_TOOL_POLICY_VALUES,
} from "@/constants/skills"
import type { DomiaSkillDescriptor, SkillFastPathBlock } from "@/types/config"
import type { DescriptorCounter, SkillDescriptorLimits } from "@/types/skills"

const finalizeRuleSchema = z
	.object({
		mode: z.enum(SKILL_FINALIZE_MODE_VALUES),
		ack: z.string().optional(),
		error: z.string().optional(),
		done: z.string().optional(),
		ackAfterMs: z.number().min(0).optional(),
	})
	.strict()

const finalizeMapSchema = z.record(z.string(), finalizeRuleSchema)

const routingSchema = z
	.object({
		aliases: z.record(z.string(), z.array(z.string())).optional(),
		exampleUtterances: z.array(z.string()).optional(),
		keywords: z.array(z.string()).optional(),
	})
	.strict()

const resilienceSchema = z
	.object({
		retryMaxAttempts: z.number().int().min(1).optional(),
		retryBackoffMs: z.number().int().min(0).optional(),
		breakerThreshold: z.number().int().min(0).optional(),
		breakerCooldownMs: z.number().int().min(0).optional(),
		idempotentWithinTurn: z.boolean().optional(),
		serveStaleTools: z.boolean().optional(),
	})
	.strict()

const toolHintSchema = z
	.object({
		readOnlyHint: z.boolean().optional(),
		destructiveHint: z.boolean().optional(),
		idempotentHint: z.boolean().optional(),
		openWorldHint: z.boolean().optional(),
		timeoutMs: z.number().int().min(0).optional(),
		cancellable: z.boolean().optional(),
	})
	.strict()

const argNormalizeSchema = z.record(
	z.string(),
	z.record(z.string(), z.array(z.enum(SKILL_ARG_NORMALIZE_OP_VALUES))),
)

const executionSchema = z
	.object({
		coreTools: z.array(z.string()).optional(),
		hiddenTools: z.array(z.string()).optional(),
		toolPolicy: z
			.record(z.string(), z.enum(SKILL_TOOL_POLICY_VALUES))
			.optional(),
		toolHints: z.record(z.string(), toolHintSchema).optional(),
		paramAllow: z.record(z.string(), z.array(z.string())).optional(),
		argNormalize: argNormalizeSchema.optional(),
		finalize: finalizeMapSchema.optional(),
		genericWords: z.array(z.string()).optional(),
		resilience: resilienceSchema.optional(),
	})
	.strict()

const fastPathSlotSourceSchema = z.union([
	z.object({ kind: z.literal("context"), key: z.string().min(1) }).strict(),
	z
		.object({ kind: z.literal("enum"), values: z.array(z.string()).min(1) })
		.strict(),
	z
		.object({
			kind: z.literal("map"),
			values: z
				.array(
					z
						.object({ in: z.array(z.string().min(1)).min(1), out: z.unknown() })
						.strict(),
				)
				.min(1),
		})
		.strict(),
	z.object({ kind: z.literal("schemaEnum"), arg: z.string().min(1) }).strict(),
	z
		.object({ kind: z.literal("range"), min: z.number(), max: z.number() })
		.strict(),
	z
		.object({
			kind: z.literal("duration"),
			maxSeconds: z.number().positive().optional(),
		})
		.strict(),
	z.object({ kind: z.literal("clockTime") }).strict(),
])

const fastPathSlotSchema = z
	.object({ source: fastPathSlotSourceSchema, arg: z.string().optional() })
	.strict()

const fastPathIntentSchema = z
	.object({
		tool: z.string().min(1),
		templates: z.array(z.string().min(1)).min(1),
		slots: z.record(z.string(), fastPathSlotSchema).optional(),
		requiredKeywords: z.array(z.array(z.string().min(1)).min(1)).optional(),
		argDefaults: z.record(z.string(), z.unknown()).optional(),
		priority: z.number().int().optional(),
		allowBlockedTokens: z.boolean().optional(),
	})
	.strict()

const fastPathBlockSchema = z
	.object({
		intents: z.array(fastPathIntentSchema),
		expansionRules: z.record(z.string(), z.string()).optional(),
	})
	.strict()

const localeSchema = routingSchema
	.extend({
		finalize: finalizeMapSchema.optional(),
		genericWords: z.array(z.string()).optional(),
		fastPath: fastPathBlockSchema.optional(),
	})
	.strict()

export const domiaSkillDescriptorSchema = z
	.object({
		version: z.literal(1),
		kind: z.string().optional(),
		description: z.string().optional(),
		routing: routingSchema.optional(),
		execution: executionSchema.optional(),
		fastPath: fastPathBlockSchema.optional(),
		i18n: z.record(z.string(), localeSchema).optional(),
	})
	.strict()

const limit = (fallback: number) => z.number().int().positive().catch(fallback)

export const descriptorLimitsSchema = z.object({
	maxBytes: limit(DESCRIPTOR_DEFAULT_LIMITS.maxBytes),
	maxTemplates: limit(DESCRIPTOR_DEFAULT_LIMITS.maxTemplates),
	maxTemplateChars: limit(DESCRIPTOR_DEFAULT_LIMITS.maxTemplateChars),
	maxExpansionRules: limit(DESCRIPTOR_DEFAULT_LIMITS.maxExpansionRules),
	maxExpansionDepth: limit(DESCRIPTOR_DEFAULT_LIMITS.maxExpansionDepth),
	maxSlotValues: limit(DESCRIPTOR_DEFAULT_LIMITS.maxSlotValues),
	maxFinalizeChars: limit(DESCRIPTOR_DEFAULT_LIMITS.maxFinalizeChars),
	maxDescriptionChars: limit(DESCRIPTOR_DEFAULT_LIMITS.maxDescriptionChars),
})

export const toDescriptorLimits = (
	raw: Record<string, number> | undefined,
): SkillDescriptorLimits => descriptorLimitsSchema.parse(raw ?? {})

export const descriptorErrors = (d?: DomiaSkillDescriptor): string[] => {
	if (!d) return []
	const parsed = domiaSkillDescriptorSchema.safeParse(d)
	if (parsed.success) return []
	return parsed.error.issues
		.slice(0, 5)
		.map((issue) =>
			issue.path.length
				? `${issue.path.join(".")}: ${issue.message}`
				: issue.message,
		)
}

const RULE_REF = /<([^<>]+)>/g

const blocksOf = (d: DomiaSkillDescriptor): SkillFastPathBlock[] => [
	...(d.fastPath ? [d.fastPath] : []),
	...Object.values(d.i18n ?? {}).flatMap((entry) =>
		entry.fastPath ? [entry.fastPath] : [],
	),
]

const expansionDepthOf = (
	rules: Record<string, string>,
	name: string,
	stack: Set<string>,
): number => {
	if (stack.has(name)) return Number.POSITIVE_INFINITY
	if (!Object.hasOwn(rules, name)) return 0
	stack.add(name)
	const nested = [...rules[name].matchAll(RULE_REF)].reduce(
		(max, match) =>
			Math.max(max, expansionDepthOf(rules, match[1].trim(), stack)),
		0,
	)
	stack.delete(name)
	return 1 + nested
}

const slotValueCount = (d: DomiaSkillDescriptor): number => {
	let max = 0
	for (const block of blocksOf(d))
		for (const intent of block.intents ?? [])
			for (const slot of Object.values(intent.slots ?? {})) {
				const source = slot.source
				if (source.kind === "enum") max = Math.max(max, source.values.length)
				if (source.kind === "map")
					max = Math.max(
						max,
						source.values.reduce((n, v) => n + v.in.length, 0),
					)
			}
	return max
}

const finalizeCharCount = (d: DomiaSkillDescriptor): number => {
	const maps = [
		d.execution?.finalize,
		...Object.values(d.i18n ?? {}).map((entry) => entry.finalize),
	]
	let max = 0
	for (const map of maps)
		for (const rule of Object.values(map ?? {}))
			for (const text of [rule.ack, rule.error, rule.done])
				max = Math.max(max, text?.length ?? 0)
	return max
}

export const descriptorCounters = (
	d: DomiaSkillDescriptor | undefined,
	limits: SkillDescriptorLimits,
): DescriptorCounter[] => {
	if (!d) return []
	const blocks = blocksOf(d)
	const templates = blocks.flatMap((block) =>
		(block.intents ?? []).flatMap((intent) => intent.templates ?? []),
	)
	const depths = blocks.flatMap((block) =>
		Object.keys(block.expansionRules ?? {}).map((name) => {
			const depth = expansionDepthOf(
				block.expansionRules ?? {},
				name,
				new Set(),
			)
			return Number.isFinite(depth) ? depth : limits.maxExpansionDepth + 1
		}),
	)
	return [
		{ id: "templates", used: templates.length, max: limits.maxTemplates },
		{
			id: "templateChars",
			used: templates.reduce((n, t) => Math.max(n, t.length), 0),
			max: limits.maxTemplateChars,
		},
		{
			id: "expansionRules",
			used: blocks.reduce(
				(n, block) =>
					Math.max(n, Object.keys(block.expansionRules ?? {}).length),
				0,
			),
			max: limits.maxExpansionRules,
		},
		{
			id: "expansionDepth",
			used: depths.length ? Math.max(...depths) : 0,
			max: limits.maxExpansionDepth,
		},
		{ id: "slotValues", used: slotValueCount(d), max: limits.maxSlotValues },
		{
			id: "finalizeChars",
			used: finalizeCharCount(d),
			max: limits.maxFinalizeChars,
		},
		{
			id: "descriptionChars",
			used: d.description?.length ?? 0,
			max: limits.maxDescriptionChars,
		},
		{
			id: "bytes",
			used: new TextEncoder().encode(JSON.stringify(d)).length,
			max: limits.maxBytes,
		},
	]
}
