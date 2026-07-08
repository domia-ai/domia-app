import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import {
	listKnowledge,
	saveKnowledge,
	removeKnowledge,
} from "@/services/knowledge"
import { idSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

const saveKnowledgeSchema = z.object({
	domiaKey: z.string().min(1),
	entry: z.object({
		id: z.string().optional(),
		title: z.string().min(1),
		content: z.string().min(1),
		keywords: z.array(z.string()).nullish(),
		priority: z.number().optional(),
		isActive: z.boolean().optional(),
	}),
})

const deleteKnowledgeSchema = z.object({
	domiaKey: z.string().min(1),
	id: z.string().min(1),
})

export const listKnowledgeFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => listKnowledge(data))

export const saveKnowledgeFn = createServerFn({ method: "POST" })
	.validator(saveKnowledgeSchema)
	.handler(({ data }) => {
		assertWritable()
		return saveKnowledge(data.domiaKey, data.entry)
	})

export const deleteKnowledgeFn = createServerFn({ method: "POST" })
	.validator(deleteKnowledgeSchema)
	.handler(({ data }) => {
		assertWritable()
		return removeKnowledge(data.domiaKey, data.id)
	})

export const knowledgeQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["knowledge", domiaKey],
		queryFn: () => listKnowledgeFn({ data: domiaKey }),
	})
