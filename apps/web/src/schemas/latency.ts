import { z } from "zod"

const EMPTY_PERCENTILES = {
	count: 0,
	p50: null,
	p90: null,
	min: null,
	max: null,
}

const percentilesSchema = z
	.looseObject({
		count: z.number().catch(0),
		p50: z.number().nullish().catch(null),
		p90: z.number().nullish().catch(null),
		min: z.number().nullish().catch(null),
		max: z.number().nullish().catch(null),
	})
	.catch(EMPTY_PERCENTILES)

export const nodeLatencyStatsSchema = z.looseObject({
	sampleSize: z.number().catch(0),
	ttfa: percentilesSchema,
	perceivedTtfa: percentilesSchema,
	stt: percentilesSchema,
	llm: percentilesSchema,
	llmQueue: percentilesSchema,
	tts: percentilesSchema,
	ttsFirstChunk: percentilesSchema,
	rssMb: percentilesSchema,
	bySatellite: z.record(z.string(), percentilesSchema).catch({}),
	speculation: z
		.looseObject({
			handedOff: z.number().catch(0),
			wastedFirstUnit: z.number().catch(0),
			discarded: z.number().catch(0),
			wasteRate: z.number().catch(0),
		})
		.catch({ handedOff: 0, wastedFirstUnit: 0, discarded: 0, wasteRate: 0 }),
	bargeIn: z
		.looseObject({
			resumed: z.number().catch(0),
			escalated: z.number().catch(0),
			recoveryRate: z.number().catch(0),
		})
		.catch({ resumed: 0, escalated: 0, recoveryRate: 0 }),
	twoTier: z
		.looseObject({
			prefills: z.number().catch(0),
			cancelled: z.number().catch(0),
			reused: z.number().catch(0),
			reprefilled: z.number().catch(0),
		})
		.catch({ prefills: 0, cancelled: 0, reused: 0, reprefilled: 0 }),
	wakeVerifier: z
		.looseObject({
			accepted: z.number().catch(0),
			rejected: z.number().catch(0),
			failedOpen: z.number().catch(0),
			rejectRate: z.number().catch(0),
		})
		.catch({ accepted: 0, rejected: 0, failedOpen: 0, rejectRate: 0 }),
})

export const nodeLatencyStatsResultSchema = z.object({
	stats: nodeLatencyStatsSchema,
})
