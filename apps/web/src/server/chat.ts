import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	sendMessage as sendMessageService,
	recentChatTurns,
} from "@/services/chat"
import { sendMessageInputSchema, idSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const sendMessage = createServerFn({ method: "POST" })
	.validator(sendMessageInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return sendMessageService(data)
	})

export const recentChatTurnsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => recentChatTurns(data))

export const chatHistoryQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["chat-history", domiaKey],
		queryFn: () => recentChatTurnsFn({ data: domiaKey }),
		staleTime: 60_000,
	})
