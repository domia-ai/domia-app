import { createServerFn } from "@tanstack/react-start"
import { runBench } from "@/services/bench"
import { benchRunInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const runBenchFn = createServerFn({ method: "POST" })
	.validator(benchRunInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return runBench(data)
	})
