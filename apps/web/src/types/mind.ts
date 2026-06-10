import type { z } from "zod"
import type { EmotionState } from "@/types"
import type { ConfigSnapshot } from "@/types/config"
import type {
	mindSchema,
	mindCharacterSchema,
	mindModulesSchema,
} from "@/schemas/mind"

export type MindCharacter = z.infer<typeof mindCharacterSchema>
export type MindModules = z.infer<typeof mindModulesSchema>
export type MindSnapshot = z.infer<typeof mindSchema>

export type MindEmotion = EmotionState

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

export type EmotionKey = keyof EmotionState
