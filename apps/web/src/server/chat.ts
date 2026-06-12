import { createServerFn } from "@tanstack/react-start"
import { sendMessage as sendMessageService } from "@/services/chat"
import { sendMessageInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const sendMessage = createServerFn({ method: "POST" })
	.validator(sendMessageInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return sendMessageService(data)
	})
