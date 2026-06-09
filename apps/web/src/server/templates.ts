import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import * as templatesService from "@/services/templates"
import {
	applyTemplateInputSchema,
	createTemplateInputSchema,
	idSchema,
	updateTemplateInputSchema,
} from "@/schemas/server"

export const listTemplatesFn = createServerFn({ method: "GET" }).handler(() =>
	templatesService.listTemplates(),
)

export const createTemplateFn = createServerFn({ method: "POST" })
	.validator(createTemplateInputSchema)
	.handler(({ data }) => templatesService.createTemplate(data))

export const updateTemplateFn = createServerFn({ method: "POST" })
	.validator(updateTemplateInputSchema)
	.handler(({ data }) => templatesService.updateTemplate(data))

export const deleteTemplateFn = createServerFn({ method: "POST" })
	.validator(idSchema)
	.handler(({ data }) => templatesService.deleteTemplate(data))

export const applyTemplateFn = createServerFn({ method: "POST" })
	.validator(applyTemplateInputSchema)
	.handler(({ data }) => templatesService.applyTemplate(data))

export const templatesQueryOptions = () =>
	queryOptions({
		queryKey: ["templates"],
		queryFn: () => listTemplatesFn(),
	})
