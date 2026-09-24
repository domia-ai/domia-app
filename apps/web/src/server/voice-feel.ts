import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	applyVoiceFeel,
	getVoiceFeel,
	revertVoiceFeel,
} from "@/services/voice-feel"
import { idSchema, voiceFeelActionInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const getVoiceFeelFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getVoiceFeel(data))

export const applyVoiceFeelFn = createServerFn({ method: "POST" })
	.validator(voiceFeelActionInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return applyVoiceFeel(data)
	})

export const revertVoiceFeelFn = createServerFn({ method: "POST" })
	.validator(voiceFeelActionInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return revertVoiceFeel(data)
	})

export const voiceFeelQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["voice-feel", domiaKey],
		queryFn: () => getVoiceFeelFn({ data: domiaKey }),
	})
