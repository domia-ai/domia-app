import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	listSetupCandidates,
	listSetupTargets,
	pairHomeAssistant,
	setSetupName,
	verifySetup,
} from "@/services/setup"
import {
	idSchema,
	pairHomeAssistantInputSchema,
	setupNameInputSchema,
} from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const listSetupCandidatesFn = createServerFn({ method: "GET" }).handler(
	() => listSetupCandidates(),
)

export const listSetupTargetsFn = createServerFn({ method: "GET" }).handler(
	() => listSetupTargets(),
)

export const setSetupNameFn = createServerFn({ method: "POST" })
	.validator(setupNameInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return setSetupName(data)
	})

export const pairHomeAssistantFn = createServerFn({ method: "POST" })
	.validator(pairHomeAssistantInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return pairHomeAssistant(data)
	})

export const verifySetupFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => verifySetup(data))

export const setupCandidatesQueryOptions = () =>
	queryOptions({
		queryKey: ["setup-candidates"],
		queryFn: () => listSetupCandidatesFn(),
		refetchInterval: 10000,
	})

export const setupTargetsQueryOptions = () =>
	queryOptions({
		queryKey: ["setup-targets"],
		queryFn: () => listSetupTargetsFn(),
		refetchInterval: 5000,
	})

export const setupVerificationQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["setup-verify", domiaKey],
		queryFn: () => verifySetupFn({ data: domiaKey }),
		staleTime: 0,
	})
