import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	cancelAgendaItem,
	cancelSatelliteTimer,
	createReminder,
	getAgenda,
	getProactivityStatus,
	listSatelliteTimers,
	startSatelliteTimer,
} from "@/services/proactivity"
import {
	cancelAgendaItemInputSchema,
	cancelSatelliteTimerInputSchema,
	createReminderInputSchema,
	idSchema,
	satelliteTimersInputSchema,
	startSatelliteTimerInputSchema,
} from "@/schemas/server"
import { assertWritable } from "@/lib/demo"
import { PROACTIVITY_REFETCH_MS } from "@/constants/proactivity"

export const getProactivityStatusFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getProactivityStatus(data))

export const getAgendaFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getAgenda(data))

export const listSatelliteTimersFn = createServerFn({ method: "GET" })
	.validator(satelliteTimersInputSchema)
	.handler(({ data }) => listSatelliteTimers(data))

export const createReminderFn = createServerFn({ method: "POST" })
	.validator(createReminderInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return createReminder(data)
	})

export const cancelAgendaItemFn = createServerFn({ method: "POST" })
	.validator(cancelAgendaItemInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return cancelAgendaItem(data)
	})

export const startSatelliteTimerFn = createServerFn({ method: "POST" })
	.validator(startSatelliteTimerInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return startSatelliteTimer(data)
	})

export const cancelSatelliteTimerFn = createServerFn({ method: "POST" })
	.validator(cancelSatelliteTimerInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return cancelSatelliteTimer(data)
	})

export const proactivityStatusQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["proactivity-status", domiaKey],
		queryFn: () => getProactivityStatusFn({ data: domiaKey }),
		refetchInterval: PROACTIVITY_REFETCH_MS,
	})

export const scheduleQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["proactivity-schedule", domiaKey],
		queryFn: () => getAgendaFn({ data: domiaKey }),
		refetchInterval: PROACTIVITY_REFETCH_MS,
	})

export const satelliteTimersQueryOptions = (
	domiaKey: string,
	satelliteId: string,
) =>
	queryOptions({
		queryKey: ["satellite-timers", domiaKey, satelliteId],
		queryFn: () => listSatelliteTimersFn({ data: { domiaKey, satelliteId } }),
		refetchInterval: PROACTIVITY_REFETCH_MS,
	})
