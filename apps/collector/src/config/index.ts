import { z } from "zod"

const envSchema = z.object({
	DATABASE_URL: z.string().default("../../data/db/domia-app.db"),
	DOMIA_APP_AUDIO_DIR: z.string().default("../../data/audio"),
	DOMIA_APP_SYNC_PAGE_SIZE: z.coerce.number().int().positive().default(200),
	DOMIA_APP_SYNC_MAX_PAGES: z.coerce.number().int().positive().default(50),
	DOMIA_APP_MAX_AUDIO_BYTES: z.coerce
		.number()
		.int()
		.positive()
		.default(26_214_400),
	MQTT_URL: z.string().default("mqtt://localhost:1883"),
	MQTT_USERNAME: z.string().default("domia"),
	MQTT_PASSWORD: z.string().default("domia"),
	MQTT_TOPIC_ROOT: z.string().default("domia"),
})

export const env = envSchema.parse(process.env)

export type Env = z.infer<typeof envSchema>
