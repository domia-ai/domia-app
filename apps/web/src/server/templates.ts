import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import * as templatesService from "@/services/templates"
import {
	applyTemplateInputSchema,
	createConfigTemplateInputSchema,
	idSchema,
	updateConfigTemplateInputSchema,
} from "@/schemas/server"

export const listTemplatesFn = createServerFn({ method: "GET" }).handler(() =>
	templatesService.listTemplates(),
)

export const deleteTemplateFn = createServerFn({ method: "POST" })
	.validator(idSchema)
	.handler(({ data }) => templatesService.deleteTemplate(data))

export const createConfigTemplateFn = createServerFn({ method: "POST" })
	.validator(createConfigTemplateInputSchema)
	.handler(({ data }) =>
		templatesService.createConfigTemplate(
			data as unknown as Parameters<
				typeof templatesService.createConfigTemplate
			>[0],
		),
	)

export const updateConfigTemplateFn = createServerFn({ method: "POST" })
	.validator(updateConfigTemplateInputSchema)
	.handler(({ data }) =>
		templatesService.updateConfigTemplate(
			data as unknown as Parameters<
				typeof templatesService.updateConfigTemplate
			>[0],
		),
	)

export const applyConfigTemplateFn = createServerFn({ method: "POST" })
	.validator(applyTemplateInputSchema)
	.handler(({ data }) => templatesService.applyConfigTemplate(data))

export const templatesQueryOptions = () =>
	queryOptions({
		queryKey: ["templates"],
		queryFn: () => listTemplatesFn(),
	})
