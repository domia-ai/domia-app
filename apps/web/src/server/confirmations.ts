import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { listConfirmations, settleConfirmation } from "@/services/confirmations"
import { idSchema, settleConfirmationInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

const CONFIRMATIONS_REFETCH_MS = 15_000

export const listConfirmationsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => listConfirmations(data))

export const settleConfirmationFn = createServerFn({ method: "POST" })
	.validator(settleConfirmationInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return settleConfirmation(data)
	})

export const confirmationsQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["confirmations", domiaKey],
		queryFn: () => listConfirmationsFn({ data: domiaKey }),
		refetchInterval: CONFIRMATIONS_REFETCH_MS,
	})
