import { z } from "zod"
import { m } from "@/paraglide/messages"

export const buildAnnounceFormSchema = () =>
	z
		.object({
			text: z.string(),
			clip: z.string().nullable(),
			delivery: z.enum(["original", "domia-voice"]),
			targets: z.array(z.string()),
		})
		.refine((v) => v.text.trim().length > 0 || !!v.clip, {
			message: m.err_announce_empty(),
			path: ["text"],
		})
		.refine((v) => v.targets.length > 0, {
			message: m.err_pick_target(),
			path: ["targets"],
		})

export const buildIntercomFormSchema = () =>
	z
		.object({
			from: z.string().min(1, m.err_pick_room()),
			to: z.string().min(1, m.err_pick_room()),
		})
		.refine((v) => v.from !== v.to, {
			message: m.err_pick_two_rooms(),
			path: ["to"],
		})
