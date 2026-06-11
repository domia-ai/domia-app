import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	getDomiaRole,
	getFleetStatsFull,
	listDomiaTargets,
	listFleet,
	listRunTargets,
} from "@/services/fleet"
import { idSchema, tableParamsSchema } from "@/schemas/server"

export const getFleetStatsFullFn = createServerFn({ method: "GET" }).handler(
	() => getFleetStatsFull(),
)

export const fleetStatsQueryOptions = () =>
	queryOptions({
		queryKey: ["fleet-stats"],
		queryFn: () => getFleetStatsFullFn(),
	})

export const listFleetFn = createServerFn({ method: "GET" })
	.validator(tableParamsSchema)
	.handler(({ data }) => listFleet(data))

export const getDomiaRoleFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getDomiaRole(data))

export const listRunTargetsFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => listRunTargets(data))

export const listDomiaTargetsFn = createServerFn({ method: "GET" }).handler(
	() => listDomiaTargets(),
)

export const domiaTargetsQueryOptions = () =>
	queryOptions({
		queryKey: ["domia-targets"],
		queryFn: () => listDomiaTargetsFn(),
	})
