import { m } from "@/paraglide/messages"
import type { CharacterEnumKey, CharacterTagKey } from "@/types/mind"

export const PERSONALITY_VALUES = [
	"OPTIMISTIC",
	"CALM",
	"ANALYTICAL",
	"EMPATHETIC",
	"NEUTRAL",
	"PLAYFUL",
	"CAUTIOUS",
	"ADAPTIVE",
	"CUSTOM",
] as const

export const PROFESSION_VALUES = [
	"HOST",
	"CHEF",
	"BARTENDER",
	"TECHNICIAN",
	"GUARDIAN",
	"ARTIST",
	"STORYTELLER",
	"PSYCHOLOGIST",
	"NONE",
] as const

export const COMMUNICATION_STYLE_VALUES = [
	"FRIENDLY",
	"FORMAL",
	"CASUAL",
	"SARCASTIC",
	"RESERVED",
	"ENTHUSIASTIC",
	"NEUTRAL",
] as const

export const PERCEIVED_AGE_VALUES = [
	"CHILD",
	"TEEN",
	"YOUNG_ADULT",
	"ADULT",
	"SENIOR",
] as const

export const KNOWLEDGE_DEPTH_VALUES = [
	"BASIC",
	"INTERMEDIATE",
	"ADVANCED",
	"EXPERT",
] as const

export const RELATIONSHIP_TYPE_VALUES = [
	"COMPANION",
	"GUIDE",
	"TEACHER",
	"HELPER",
	"GUARDIAN",
	"ENTERTAINER",
] as const

export const ROLE_MODE_VALUES = [
	"ACTIVE",
	"PASSIVE",
	"OBSERVER",
	"ADVISOR",
] as const

export const CHARACTER_ENUM_FIELDS: {
	key: CharacterEnumKey
	label: () => string
	values: readonly string[]
}[] = [
	{
		key: "personality",
		label: m.mind_field_personality,
		values: PERSONALITY_VALUES,
	},
	{
		key: "profession",
		label: m.mind_field_profession,
		values: PROFESSION_VALUES,
	},
	{
		key: "communicationStyle",
		label: m.mind_field_communication_style,
		values: COMMUNICATION_STYLE_VALUES,
	},
	{
		key: "perceivedAge",
		label: m.mind_field_perceived_age,
		values: PERCEIVED_AGE_VALUES,
	},
	{
		key: "knowledgeDepth",
		label: m.mind_field_knowledge_depth,
		values: KNOWLEDGE_DEPTH_VALUES,
	},
	{
		key: "relationshipType",
		label: m.mind_field_relationship,
		values: RELATIONSHIP_TYPE_VALUES,
	},
	{ key: "roleMode", label: m.mind_field_role_mode, values: ROLE_MODE_VALUES },
]

export const CHARACTER_TAG_FIELDS: {
	key: CharacterTagKey
	label: () => string
}[] = [
	{ key: "languagesSpoken", label: m.mind_field_languages_spoken },
	{ key: "interests", label: m.mind_field_interests },
	{ key: "hobbies", label: m.mind_field_hobbies },
	{ key: "skills", label: m.mind_field_skills },
]
