import { z } from "zod"

export const announceFormSchema = z.object({
	text: z.string().trim().min(1, "Type something to announce"),
})

export const intercomFormSchema = z
	.object({
		from: z.string().min(1, "Pick a room"),
		to: z.string().min(1, "Pick a room"),
	})
	.refine((v) => v.from !== v.to, {
		message: "Pick two different rooms",
		path: ["to"],
	})
