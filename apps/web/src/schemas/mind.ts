import { z } from "zod"
import {
	COMMUNICATION_STYLE_VALUES,
	KNOWLEDGE_DEPTH_VALUES,
	PERCEIVED_AGE_VALUES,
	PERSONALITY_VALUES,
	PROFESSION_VALUES,
	RELATIONSHIP_TYPE_VALUES,
	ROLE_MODE_VALUES,
} from "@/constants/mind"

const promptOverridesSchema = z.object({
	identity: z.string().nullish(),
	traits: z.array(z.string()).nullish(),
	styleNotes: z.string().nullish(),
	environmentContext: z.string().nullish(),
})

const emotionAxis = z.number().min(-1).max(1)

export const mindEmotionSchema = z.object({
	joy: emotionAxis,
	sadness: emotionAxis,
	anger: emotionAxis,
	fear: emotionAxis,
	trust: emotionAxis,
	disgust: emotionAxis,
	anticipation: emotionAxis,
	surprise: emotionAxis,
})

export const mindCharacterSchema = z.object({
	name: z.string(),
	personality: z.enum(PERSONALITY_VALUES),
	language: z.string(),
	profession: z.enum(PROFESSION_VALUES),
	communicationStyle: z.enum(COMMUNICATION_STYLE_VALUES),
	perceivedAge: z.enum(PERCEIVED_AGE_VALUES),
	culturalBackground: z.string().nullish(),
	languagesSpoken: z.array(z.string()).nullish(),
	knowledgeDepth: z.enum(KNOWLEDGE_DEPTH_VALUES),
	interests: z.array(z.string()).nullish(),
	hobbies: z.array(z.string()).nullish(),
	skills: z.array(z.string()).nullish(),
	relationshipType: z.enum(RELATIONSHIP_TYPE_VALUES),
	roleMode: z.enum(ROLE_MODE_VALUES),
	promptOverrides: promptOverridesSchema.nullish(),
})

export const mindModulesSchema = z.object({
	emotionEngine: z.boolean(),
	memoryEngine: z.boolean(),
	collectiveMind: z.boolean(),
	remoteAccessEngine: z.boolean(),
	narrativeEngine: z.boolean(),
	identityEngine: z.boolean(),
})

export const mindSchema = z.object({
	character: mindCharacterSchema,
	emotionBaseline: mindEmotionSchema,
	modules: mindModulesSchema,
})
