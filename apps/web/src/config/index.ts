import { z } from "zod"

const envSchema = z.object({
	DATABASE_URL: z.string().default("../../data/db/domia-app.db"),
	DOMIA_APP_AUDIO_DIR: z.string().default("../../data/audio"),
	DOMIA_APP_PROPERTY_NAME: z.string().default("Casa Norte"),
	DOMIA_NODE_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
