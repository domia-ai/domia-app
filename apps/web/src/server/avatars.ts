import { createServerFn } from "@tanstack/react-start"
import { setAvatar } from "@/services/avatars"
import { setAvatarInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const setAvatarFn = createServerFn({ method: "POST" })
	.validator(setAvatarInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return setAvatar(data)
	})
