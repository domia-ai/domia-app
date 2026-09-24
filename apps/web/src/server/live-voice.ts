import { createServerFn } from "@tanstack/react-start"
import { mintLiveVoiceToken } from "@/services/live-voice"
import { liveVoiceTokenInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const mintLiveVoiceTokenFn = createServerFn({ method: "POST" })
	.validator(liveVoiceTokenInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return mintLiveVoiceToken(data)
	})
