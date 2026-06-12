import { createServerFn } from "@tanstack/react-start"
import * as gradingService from "@/services/grading"
import { bulkGradeInputSchema, gradeInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const gradeInteraction = createServerFn({ method: "POST" })
	.validator(gradeInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return gradingService.gradeInteraction(data, "console")
	})

export const bulkGradeInteractions = createServerFn({ method: "POST" })
	.validator(bulkGradeInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return gradingService.bulkGradeInteractions(data, "console")
	})
