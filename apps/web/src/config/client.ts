import { z } from "zod"

const clientEnvSchema = z.object({
	VITE_DOMIA_APP_DEMO_MODE: z
		.enum(["true", "false"])
		.default("false")
		.transform((v) => v === "true"),
})

export const clientEnv = clientEnvSchema.parse(import.meta.env)

export type ClientEnv = z.infer<typeof clientEnvSchema>
