import { z } from "zod"

export const bindSatelliteFormSchema = z.object({
	targetKey: z.string().min(1, "Pick a room"),
	encryptionKey: z.string(),
})

export const addIdentityFormSchema = z.object({
	name: z.string().trim().min(1, "Name is required").max(80),
})
