import {
	Ban,
	CircleAlert,
	Eye,
	FileCog,
	Flame,
	ShieldAlert,
	ShieldCheck,
	ShieldQuestionMark,
	SquarePen,
} from "lucide-react"
import { m } from "@/paraglide/messages"
import type { SkillProviderTransport } from "@/types/config"
import type {
	DescriptorCounterId,
	SkillDescriptorLimits,
	SkillPolicyBadgeMeta,
	SkillRiskClass,
	SkillRiskClassMeta,
	SkillToolPolicy,
	SkillTrustTier,
	SkillTrustTierMeta,
} from "@/types/skills"

export const SKILL_TRUST_TIER_VALUES = [
	"untrusted",
	"standard",
	"trusted",
] as const

export const SKILL_RISK_CLASS_VALUES = [
	"read",
	"write_additive",
	"write_destructive",
] as const

export const DEFAULT_SKILL_TRUST_TIER: SkillTrustTier = "untrusted"

export const SKILL_TOOL_POLICY_VALUES = ["allow", "confirm", "block"] as const

export const SKILL_POLICY_SOURCE_VALUES = [
	"descriptor",
	"risk_default",
] as const

export const SKILL_TRUST_TIER_META: Record<SkillTrustTier, SkillTrustTierMeta> =
	{
		untrusted: {
			label: m.skills_health_trust_untrusted,
			help: m.skills_health_trust_untrusted_help,
			icon: ShieldQuestionMark,
			className:
				"border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
		},
		standard: {
			label: m.skills_health_trust_standard,
			help: m.skills_health_trust_standard_help,
			icon: ShieldAlert,
			className:
				"border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
		},
		trusted: {
			label: m.skills_health_trust_trusted,
			help: m.skills_health_trust_trusted_help,
			icon: ShieldCheck,
			className:
				"border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
		},
	}

export const SKILL_RISK_CLASS_META: Record<SkillRiskClass, SkillRiskClassMeta> =
	{
		read: {
			label: m.skills_health_risk_read,
			icon: Eye,
			className: "border-border bg-muted text-muted-foreground",
		},
		write_additive: {
			label: m.skills_health_risk_write,
			icon: SquarePen,
			className:
				"border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-400",
		},
		write_destructive: {
			label: m.skills_health_risk_destructive,
			icon: Flame,
			className: "border-destructive/40 bg-destructive/10 text-destructive",
		},
	}

export const SKILL_POLICY_BADGE_META: Record<
	Exclude<SkillToolPolicy, "allow">,
	SkillPolicyBadgeMeta
> = {
	confirm: {
		label: m.skills_health_policy_confirm,
		icon: CircleAlert,
		className:
			"border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
	},
	block: {
		label: m.skills_health_policy_block,
		icon: Ban,
		className: "border-destructive/40 bg-destructive/10 text-destructive",
	},
}

export const SKILL_ADVANCED_CONFIG_KEYS: Record<string, readonly string[]> = {
	"*": ["protocolMode", "command", "commandArgs", "commandEnv"],
	"home-assistant": ["dataPlane", "wsUrl"],
	"music-assistant": [
		"playerAliases",
		"rosterTtlMs",
		"searchLimit",
		"volumeStepPercent",
	],
}

export const SKILL_DESCRIPTOR_ICON = FileCog

export const SKILL_TOOL_POLICY_ORDER: Record<SkillToolPolicy, number> = {
	block: 0,
	confirm: 1,
	allow: 2,
}

export const SKILL_RISK_CLASS_ORDER: Record<SkillRiskClass, number> = {
	write_destructive: 0,
	write_additive: 1,
	read: 2,
}

export const SKILL_FINALIZE_MODE_VALUES = [
	"agent_loop",
	"template",
	"async",
	"deadline",
] as const

export const SKILL_ARG_NORMALIZE_OP_VALUES = [
	"trim",
	"lowercase",
	"uppercase",
	"collapseSpaces",
	"number",
	"integer",
	"boolean",
	"string",
	"stringList",
	"stripUnits",
	"percentToFraction",
	"fractionToPercent",
	"fahrenheitToCelsius",
	"celsiusToFahrenheit",
] as const

export const SKILL_TOOL_NAME_SEPARATOR = "__"

export const DESCRIPTOR_SCHEMA_STALE_MS = 5 * 60 * 1000

export const DESCRIPTOR_DEFAULT_LIMITS: SkillDescriptorLimits = {
	maxBytes: 64 * 1024,
	maxTemplates: 200,
	maxTemplateChars: 200,
	maxExpansionRules: 50,
	maxExpansionDepth: 4,
	maxSlotValues: 50,
	maxFinalizeChars: 200,
	maxDescriptionChars: 500,
}

export const DESCRIPTOR_COUNTER_LABELS: Record<
	DescriptorCounterId,
	() => string
> = {
	templates: m.desc_count_templates,
	templateChars: m.desc_count_template_chars,
	expansionRules: m.desc_count_expansion_rules,
	expansionDepth: m.desc_count_expansion_depth,
	slotValues: m.desc_count_slot_values,
	finalizeChars: m.desc_count_finalize_chars,
	descriptionChars: m.desc_count_description_chars,
	bytes: m.desc_count_bytes,
}

export const SKILL_HEADERS_JSON_SAMPLE = '{ "X-API-Key": "…" }'
export const SKILL_ADVANCED_CONFIG_JSON_SAMPLE = '{ "protocolMode": "auto" }'

export const SKILL_TRANSPORT_OPTIONS: readonly {
	value: SkillProviderTransport
	label: () => string
}[] = [
	{ value: "http", label: () => "Streamable HTTP" },
	{ value: "sse", label: () => "SSE" },
	{ value: "stdio", label: m.desc_provider_transport_stdio },
]
