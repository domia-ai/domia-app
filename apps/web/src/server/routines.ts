import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	listRoutines,
	removeRoutine,
	saveRoutine,
	tryFastPath,
} from "@/services/routines"
import {
	deleteRoutineInputSchema,
	idSchema,
	routineInputSchema,
	tryFastPathInputSchema,
} from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const listRoutinesFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => listRoutines(data))

export const saveRoutineFn = createServerFn({ method: "POST" })
	.validator(routineInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return saveRoutine(data.domiaKey, data.routine)
	})

export const deleteRoutineFn = createServerFn({ method: "POST" })
	.validator(deleteRoutineInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return removeRoutine(data.domiaKey, data.id)
	})

export const tryFastPathFn = createServerFn({ method: "POST" })
	.validator(tryFastPathInputSchema)
	.handler(({ data }) => tryFastPath(data.domiaKey, data.text))

export const routinesQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["routines", domiaKey],
		queryFn: () => listRoutinesFn({ data: domiaKey }),
	})
