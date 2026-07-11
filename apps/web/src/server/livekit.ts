import { createServerFn } from "@tanstack/react-start"
import { getLivekitToken } from "@/services/livekit"
import { livekitTokenInputSchema } from "@/schemas/server"

export const getLivekitTokenFn = createServerFn({ method: "GET" })
	.validator(livekitTokenInputSchema)
	.handler(({ data }) => getLivekitToken(data))
