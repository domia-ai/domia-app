import { createServerFn } from "@tanstack/react-start"
import * as gradingService from "@/services/grading"
import { bulkGradeInputSchema, gradeInputSchema } from "@/schemas/server"

export const gradeInteraction = createServerFn({ method: "POST" })
	.validator(gradeInputSchema)
	.handler(({ data }) => gradingService.gradeInteraction(data, "console"))

export const bulkGradeInteractions = createServerFn({ method: "POST" })
	.validator(bulkGradeInputSchema)
	.handler(({ data }) => gradingService.bulkGradeInteractions(data, "console"))
