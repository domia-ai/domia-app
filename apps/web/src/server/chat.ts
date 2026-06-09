import { createServerFn } from "@tanstack/react-start"
import { sendMessage as sendMessageService } from "@/services/chat"
import { sendMessageInputSchema } from "@/schemas/server"

export const sendMessage = createServerFn({ method: "POST" })
	.validator(sendMessageInputSchema)
	.handler(({ data }) => sendMessageService(data))
