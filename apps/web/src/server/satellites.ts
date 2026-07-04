import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	discoverSatellites,
	listSatellites,
	listAllSatellites,
	bindSatellite,
	unbindSatellite,
	setSatelliteWakeWords,
	setSatelliteNumber,
	setSatelliteFollowUp,
	setSatelliteVolume,
	testSatelliteSpeaker,
} from "@/services/satellites"
import {
	discoverSatellitesInputSchema,
	listSatellitesInputSchema,
	bindSatelliteInputSchema,
	unbindSatelliteInputSchema,
	setSatelliteWakeWordsInputSchema,
	setSatelliteNumberInputSchema,
	setSatelliteFollowUpInputSchema,
	setSatelliteVolumeInputSchema,
	testSatelliteSpeakerInputSchema,
} from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const discoverSatellitesFn = createServerFn({ method: "GET" })
	.validator(discoverSatellitesInputSchema)
	.handler(({ data }) => discoverSatellites(data))

export const listSatellitesFn = createServerFn({ method: "GET" })
	.validator(listSatellitesInputSchema)
	.handler(({ data }) => listSatellites(data))

export const bindSatelliteFn = createServerFn({ method: "POST" })
	.validator(bindSatelliteInputSchema)
	.handler(({ data }) => {
		assertWritable()
		const { domiaKey, ...satellite } = data
		return bindSatellite({ domiaKey, satellite })
	})

export const unbindSatelliteFn = createServerFn({ method: "POST" })
	.validator(unbindSatelliteInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return unbindSatellite(data)
	})

export const setSatelliteWakeWordsFn = createServerFn({ method: "POST" })
	.validator(setSatelliteWakeWordsInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return setSatelliteWakeWords(data)
	})

export const setSatelliteNumberFn = createServerFn({ method: "POST" })
	.validator(setSatelliteNumberInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return setSatelliteNumber(data)
	})

export const setSatelliteFollowUpFn = createServerFn({ method: "POST" })
	.validator(setSatelliteFollowUpInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return setSatelliteFollowUp(data)
	})

export const setSatelliteVolumeFn = createServerFn({ method: "POST" })
	.validator(setSatelliteVolumeInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return setSatelliteVolume(data)
	})

export const testSatelliteSpeakerFn = createServerFn({ method: "POST" })
	.validator(testSatelliteSpeakerInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return testSatelliteSpeaker(data)
	})

export const listAllSatellitesFn = createServerFn({ method: "GET" }).handler(
	() => listAllSatellites(),
)

export const satellitesQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["satellites", domiaKey],
		queryFn: () => listSatellitesFn({ data: domiaKey }),
		refetchInterval: 3000,
	})

export const allSatellitesQueryOptions = () =>
	queryOptions({
		queryKey: ["satellites-all"],
		queryFn: () => listAllSatellitesFn(),
		refetchInterval: 4000,
	})

export const discoverSatellitesQueryOptions = (anchorDomiaKey: string) =>
	queryOptions({
		queryKey: ["satellites-discover", anchorDomiaKey],
		queryFn: () => discoverSatellitesFn({ data: anchorDomiaKey }),
		enabled: false,
		staleTime: 0,
		gcTime: 0,
	})
