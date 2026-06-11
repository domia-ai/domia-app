import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { setAvatar } from "@/services/avatars"

const setAvatarSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("preset"),
		domiaKey: z.string().min(1).max(200),
		presetId: z.string().min(1).max(64),
	}),
	z.object({
		kind: z.literal("custom"),
		domiaKey: z.string().min(1).max(200),
		dataBase64: z.string().min(1),
		mime: z.string().min(1).max(64),
	}),
	z.object({
		kind: z.literal("clear"),
		domiaKey: z.string().min(1).max(200),
	}),
])

export const setAvatarFn = createServerFn({ method: "POST" })
	.validator(setAvatarSchema)
	.handler(({ data }) => setAvatar(data))
