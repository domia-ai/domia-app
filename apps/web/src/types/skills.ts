import type { LucideIcon } from "lucide-react"
import type { z } from "zod"
import type {
	SKILL_RISK_CLASS_VALUES,
	SKILL_TOOL_POLICY_VALUES,
	SKILL_TRUST_TIER_VALUES,
} from "@/constants/skills"
import type {
	skillProviderStatusSchema,
	skillToolStatusSchema,
	skillsStatusPayloadSchema,
} from "@/schemas/skills"

export type SkillTrustTier = (typeof SKILL_TRUST_TIER_VALUES)[number]
export type SkillRiskClass = (typeof SKILL_RISK_CLASS_VALUES)[number]
export type SkillToolPolicy = (typeof SKILL_TOOL_POLICY_VALUES)[number]

export type SkillToolPayload = z.infer<typeof skillToolStatusSchema>
export type SkillProviderPayload = z.infer<typeof skillProviderStatusSchema>
export type SkillsStatusPayload = z.infer<typeof skillsStatusPayloadSchema>

export type SkillToolView = {
	rawName: string
	namespacedName: string
	displayName: string
	riskClass: SkillRiskClass | null
	policy: SkillToolPolicy | null
	fromDescriptor: boolean
	hidden?: boolean
}

export type SkillProviderStatus = {
	id: string
	name: string
	kind: string | null
	trustTier: string | null
	connected: boolean
	cachedTools: number
	allowedTools: number
	lastSyncAt: string | null
	toolsFreshUntil?: string | null
	toolsRefreshMs?: number | null
	protocolEra?: string | null
	specialization: Record<string, string | number | boolean | null> | null
	tools: SkillToolView[]
	confirmTools: number
	blockedTools: number
	hiddenTools?: number
}

export type SkillsStatusResult = {
	skillsEngine: boolean
	builtinTools: boolean
	providers: SkillProviderStatus[]
}

export type SkillTrustTierMeta = {
	label: () => string
	help: () => string
	icon: LucideIcon
	className: string
}

export type SkillRiskClassMeta = {
	label: () => string
	icon: LucideIcon
	className: string
}

export type SkillPolicyBadgeMeta = {
	label: () => string
	icon: LucideIcon
	className: string
}

export type DiscoveredSkillProvider = {
	kind: string
	name: string
	url: string
	host: string
	port: number
	version: string | null
}

export type DiscoverSkillProvidersResult = {
	providers: DiscoveredSkillProvider[]
}

export type SkillDescriptorSchemaResult = {
	schema: Record<string, unknown>
	resourceUri: string
	serverAllowed: string[]
	stripped: string[]
	rejected: string[]
	limits: Record<string, number>
}

export type SkillDescriptorSchemaInfo = {
	resourceUri: string
	stripped: string[]
	rejected: string[]
	limits: Record<string, number>
}

export type SkillDescriptorLimits = {
	maxBytes: number
	maxTemplates: number
	maxTemplateChars: number
	maxExpansionRules: number
	maxExpansionDepth: number
	maxSlotValues: number
	maxFinalizeChars: number
	maxDescriptionChars: number
}

export type SkillToolOptionsStatus = "loading" | "error" | "ready"

export type SkillToolOptions = {
	status: SkillToolOptionsStatus
	tools: SkillToolView[]
	message: string | null
}

export type DescriptorCounterId =
	| "templates"
	| "templateChars"
	| "expansionRules"
	| "expansionDepth"
	| "slotValues"
	| "finalizeChars"
	| "descriptionChars"
	| "bytes"

export type DescriptorCounter = {
	id: DescriptorCounterId
	used: number
	max: number
}

export type DescriptorLimitsView = {
	limits: SkillDescriptorLimits
	fromNode: boolean
	resourceUri: string | null
	stripped: string[]
	rejected: string[]
}
