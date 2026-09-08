import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { skillsStatus, discoverSkillProviders } from "@/services/skills"
import {
	skillsStatusInputSchema,
	discoverSkillProvidersInputSchema,
} from "@/schemas/server"

export const getSkillsStatusFn = createServerFn({ method: "GET" })
	.validator(skillsStatusInputSchema)
	.handler(({ data }) => skillsStatus(data))

export const discoverSkillProvidersFn = createServerFn({ method: "GET" })
	.validator(discoverSkillProvidersInputSchema)
	.handler(({ data }) => discoverSkillProviders(data))

export const skillsStatusQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["skills-status", domiaKey],
		queryFn: () => getSkillsStatusFn({ data: domiaKey }),
	})
