import { createServerFn } from "@tanstack/react-start"
import { runInteraction as runInteractionService } from "@/services/run"
import { runInteractionInputSchema } from "@/schemas/server"

export const runInteraction = createServerFn({ method: "POST" })
	.validator(runInteractionInputSchema)
	.handler(({ data }) => runInteractionService(data))
