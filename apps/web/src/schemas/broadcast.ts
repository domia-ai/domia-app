import { z } from "zod"

export const announceFormSchema = z
	.object({
		text: z.string(),
		clip: z.string().nullable(),
		delivery: z.enum(["original", "domia-voice"]),
		targets: z.array(z.string()),
	})
	.refine((v) => v.text.trim().length > 0 || !!v.clip, {
		message: "Type a message or record a clip",
		path: ["text"],
	})
	.refine((v) => v.targets.length > 0, {
		message: "Pick at least one target",
		path: ["targets"],
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
