import { createServerFn } from "@tanstack/react-start"
import { runInteraction as runInteractionService } from "@/services/run"
import { runInteractionInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const runInteraction = createServerFn({ method: "POST" })
	.validator(runInteractionInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return runInteractionService(data)
	})
