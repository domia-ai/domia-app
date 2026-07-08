import { m } from "@/paraglide/messages"
import type {
	CharacterEnumKey,
	CharacterTagKey,
	EmotionKey,
	MindModules,
	MindSnapshot,
} from "@/types/mind"

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

export const MIND_MODULE_FIELDS: {
	key: keyof MindModules
	label: () => string
	hint: () => string
}[] = [
	{
		key: "emotionEngine",
		label: m.mind_module_emotion_engine,
		hint: m.mind_module_emotion_engine_hint,
	},
	{
		key: "memoryEngine",
		label: m.mind_module_memory_engine,
		hint: m.mind_module_memory_engine_hint,
	},
	{
		key: "collectiveMind",
		label: m.mind_module_collective_mind,
		hint: m.mind_module_collective_mind_hint,
	},
	{
		key: "remoteAccessEngine",
		label: m.mind_module_remote_access,
		hint: m.mind_module_remote_access_hint,
	},
	{
		key: "narrativeEngine",
		label: m.mind_module_narrative_engine,
		hint: m.mind_module_narrative_engine_hint,
	},
	{
		key: "identityEngine",
		label: m.mind_module_identity_engine,
		hint: m.mind_module_identity_engine_hint,
	},
]

export const EMOTION_FIELDS: { key: EmotionKey; label: () => string }[] = [
	{ key: "joy", label: m.enum_emotion_joy },
	{ key: "sadness", label: m.enum_emotion_sadness },
	{ key: "anger", label: m.enum_emotion_anger },
	{ key: "fear", label: m.enum_emotion_fear },
	{ key: "trust", label: m.enum_emotion_trust },
	{ key: "disgust", label: m.enum_emotion_disgust },
	{ key: "anticipation", label: m.enum_emotion_anticipation },
	{ key: "surprise", label: m.enum_emotion_surprise },
]

export const DEFAULT_TEMPLATE_MIND: MindSnapshot = {
	character: {
		name: "New Persona",
		personality: "NEUTRAL",
		language: "en",
		profession: "NONE",
		communicationStyle: "NEUTRAL",
		perceivedAge: "ADULT",
		culturalBackground: null,
		languagesSpoken: ["en"],
		knowledgeDepth: "INTERMEDIATE",
		interests: [],
		hobbies: [],
		skills: [],
		relationshipType: "COMPANION",
		roleMode: "ACTIVE",
		promptOverrides: null,
	},
	emotionBaseline: {
		joy: 0.5,
		sadness: 0.1,
		anger: 0.05,
		fear: 0.15,
		trust: 0.6,
		disgust: 0.05,
		anticipation: 0.4,
		surprise: 0.2,
	},
	modules: {
		emotionEngine: true,
		memoryEngine: true,
		collectiveMind: true,
		remoteAccessEngine: true,
		narrativeEngine: true,
		identityEngine: true,
	},
}
