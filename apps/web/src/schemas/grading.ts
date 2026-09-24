import { z } from "zod"

export const gradeSchema = z.object({
	rating: z.enum(["up", "down"]).nullable(),
	correction: z.string(),
	tags: z.array(z.string()),
})
