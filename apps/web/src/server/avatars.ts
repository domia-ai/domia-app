import { createServerFn } from "@tanstack/react-start"
import { setAvatar } from "@/services/avatars"
import { setAvatarInputSchema } from "@/schemas/server"

export const setAvatarFn = createServerFn({ method: "POST" })
	.validator(setAvatarInputSchema)
	.handler(({ data }) => setAvatar(data))
