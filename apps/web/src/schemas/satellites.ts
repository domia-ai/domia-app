import { z } from "zod"
import { m } from "@/paraglide/messages"

export const buildBindSatelliteFormSchema = () =>
	z.object({
		targetKey: z.string().min(1, m.err_pick_room()),
		encryptionKey: z.string(),
	})

export const buildAddIdentityFormSchema = () =>
	z.object({
		name: z.string().trim().min(1, m.err_name_required()).max(80),
	})
