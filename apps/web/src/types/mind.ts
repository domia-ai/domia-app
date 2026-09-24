import type { ConfigSnapshot } from "@/types/config"

export type AppTemplate = {
	id: string
	name: string
	description: string
	config: ConfigSnapshot
	isSystem: boolean
	createdAt: number
	updatedAt: number
}

export type CreateConfigTemplateInput = {
	name: string
	description: string
	config: ConfigSnapshot
}

export type ApplyTemplateInput = { templateId: string; domiaKey: string }

export type TemplateCardProps = {
	template: AppTemplate
	targets: { domiaKey: string; name: string; online: boolean }[]
}

export type CharacterEnumKey =
	| "personality"
	| "profession"
	| "communicationStyle"
	| "perceivedAge"
	| "knowledgeDepth"
	| "relationshipType"
	| "roleMode"

export type CharacterTagKey =
	| "languagesSpoken"
	| "interests"
	| "hobbies"
	| "skills"
