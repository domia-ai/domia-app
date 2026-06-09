import type { z } from "zod"
import type { EmotionState } from "@/types"
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
	mind: MindSnapshot
	createdAt: number
	updatedAt: number
}

export type CreateTemplateInput = {
	name: string
	description: string
	mind: MindSnapshot
}

export type UpdateTemplateInput = CreateTemplateInput & { id: string }

export type ApplyTemplateInput = { templateId: string; domiaKey: string }

export type TemplateEditorProps = {
	template: AppTemplate | null
	onClose: () => void
}

export type TemplateCardProps = {
	template: AppTemplate
	targets: { domiaKey: string; name: string; online: boolean }[]
	onEdit: (template: AppTemplate) => void
}

export type NodeMindResponse = { mind: MindSnapshot }

export type MindEditorData = { mind: MindSnapshot; templates: AppTemplate[] }

export type ImportMindInput = { domiaKey: string; mind: MindSnapshot }

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

export type ConfigDialogProps = {
	domiaKey: string
	domiaName: string
	online: boolean
}

export type MindEditorProps = {
	domiaKey: string
	mind: MindSnapshot
	templates: AppTemplate[]
	onClose: () => void
}
