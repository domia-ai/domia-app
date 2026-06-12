import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import * as templatesService from "@/services/templates"
import {
	applyTemplateInputSchema,
	createConfigTemplateInputSchema,
	idSchema,
	updateConfigTemplateInputSchema,
} from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const listTemplatesFn = createServerFn({ method: "GET" }).handler(() =>
	templatesService.listTemplates(),
)

export const deleteTemplateFn = createServerFn({ method: "POST" })
	.validator(idSchema)
	.handler(({ data }) => {
		assertWritable()
		return templatesService.deleteTemplate(data)
	})

export const createConfigTemplateFn = createServerFn({ method: "POST" })
	.validator(createConfigTemplateInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return templatesService.createConfigTemplate(
			data as unknown as Parameters<
				typeof templatesService.createConfigTemplate
			>[0],
		)
	})

export const updateConfigTemplateFn = createServerFn({ method: "POST" })
	.validator(updateConfigTemplateInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return templatesService.updateConfigTemplate(
			data as unknown as Parameters<
				typeof templatesService.updateConfigTemplate
			>[0],
		)
	})

export const applyConfigTemplateFn = createServerFn({ method: "POST" })
	.validator(applyTemplateInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return templatesService.applyConfigTemplate(data)
	})

export const templatesQueryOptions = () =>
	queryOptions({
		queryKey: ["templates"],
		queryFn: () => listTemplatesFn(),
	})
