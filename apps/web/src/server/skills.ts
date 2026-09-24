import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	skillsStatus,
	discoverSkillProviders,
	descriptorSchema,
} from "@/services/skills"
import {
	skillsStatusInputSchema,
	discoverSkillProvidersInputSchema,
} from "@/schemas/server"
import { DESCRIPTOR_SCHEMA_STALE_MS } from "@/constants/skills"

export const getSkillsStatusFn = createServerFn({ method: "GET" })
	.validator(skillsStatusInputSchema)
	.handler(({ data }) => skillsStatus(data))

export const discoverSkillProvidersFn = createServerFn({ method: "GET" })
	.validator(discoverSkillProvidersInputSchema)
	.handler(({ data }) => discoverSkillProviders(data))

export const getDescriptorSchemaFn = createServerFn({ method: "GET" })
	.validator(skillsStatusInputSchema)
	.handler(({ data }) => descriptorSchema(data))

export const skillsStatusQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["skills-status", domiaKey],
		queryFn: () => getSkillsStatusFn({ data: domiaKey }),
	})

export const descriptorSchemaQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["descriptor-schema", domiaKey],
		queryFn: () => getDescriptorSchemaFn({ data: domiaKey }),
		staleTime: DESCRIPTOR_SCHEMA_STALE_MS,
	})
