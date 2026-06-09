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
	label: string
	values: readonly string[]
}[] = [
	{ key: "personality", label: "Personality", values: PERSONALITY_VALUES },
	{ key: "profession", label: "Profession", values: PROFESSION_VALUES },
	{
		key: "communicationStyle",
		label: "Communication style",
		values: COMMUNICATION_STYLE_VALUES,
	},
	{ key: "perceivedAge", label: "Perceived age", values: PERCEIVED_AGE_VALUES },
	{
		key: "knowledgeDepth",
		label: "Knowledge depth",
		values: KNOWLEDGE_DEPTH_VALUES,
	},
	{
		key: "relationshipType",
		label: "Relationship",
		values: RELATIONSHIP_TYPE_VALUES,
	},
	{ key: "roleMode", label: "Role mode", values: ROLE_MODE_VALUES },
]

export const CHARACTER_TAG_FIELDS: { key: CharacterTagKey; label: string }[] = [
	{ key: "languagesSpoken", label: "Languages spoken" },
	{ key: "interests", label: "Interests" },
	{ key: "hobbies", label: "Hobbies" },
	{ key: "skills", label: "Skills" },
]

export const MIND_MODULE_FIELDS: {
	key: keyof MindModules
	label: string
	hint: string
}[] = [
	{
		key: "emotionEngine",
		label: "Emotion engine",
		hint: "Applies a mood to replies.",
	},
	{
		key: "memoryEngine",
		label: "Memory engine",
		hint: "Recalls prior turns and facts.",
	},
	{
		key: "collectiveMind",
		label: "Collective mind",
		hint: "Shares knowledge across Domias.",
	},
	{
		key: "remoteAccessEngine",
		label: "Remote access",
		hint: "Allows delegating work to peers.",
	},
	{
		key: "narrativeEngine",
		label: "Narrative engine",
		hint: "Maintains a running story arc.",
	},
	{
		key: "identityEngine",
		label: "Identity engine",
		hint: "Recognizes who is speaking.",
	},
]

export const EMOTION_FIELDS: { key: EmotionKey; label: string }[] = [
	{ key: "joy", label: "Joy" },
	{ key: "sadness", label: "Sadness" },
	{ key: "anger", label: "Anger" },
	{ key: "fear", label: "Fear" },
	{ key: "trust", label: "Trust" },
	{ key: "disgust", label: "Disgust" },
	{ key: "anticipation", label: "Anticipation" },
	{ key: "surprise", label: "Surprise" },
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
