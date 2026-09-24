import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	exportMind,
	importMind,
	savePersonaTemplate,
} from "@/services/mind-transfer"
import {
	importMindInputSchema,
	savePersonaTemplateInputSchema,
} from "@/schemas/mind-transfer"
import { idSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"
import type { ActionResult } from "@/types"

export const exportMindFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(async ({ data }): Promise<ActionResult<string>> => {
		const result = await exportMind({ domiaKey: data })
		if (!result.ok) return result
		return { ok: true, data: JSON.stringify(result.data ?? null) }
	})

export const importMindFn = createServerFn({ method: "POST" })
	.validator(importMindInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return importMind(data)
	})

export const savePersonaTemplateFn = createServerFn({ method: "POST" })
	.validator(savePersonaTemplateInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return savePersonaTemplate(data)
	})

export const mindExportQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["mind-export", domiaKey],
		queryFn: () => exportMindFn({ data: domiaKey }),
		staleTime: 0,
		gcTime: 0,
	})
