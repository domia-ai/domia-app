import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getMindEditor, importMind } from "@/services/mind"
import { idSchema, importMindInputSchema } from "@/schemas/server"

export const getMindEditorFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getMindEditor(data))

export const importMindFn = createServerFn({ method: "POST" })
	.validator(importMindInputSchema)
	.handler(({ data }) => importMind(data))

export const mindEditorQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["mind-editor", domiaKey],
		queryFn: () => getMindEditorFn({ data: domiaKey }),
	})
