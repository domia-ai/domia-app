import { z } from "zod"

export const domiaSnapshotSchema = z.looseObject({
	domiaKey: z.string().min(1),
	id: z.string().optional(),
	name: z.string().min(1),
	nodeId: z.string().nullish(),
	isActive: z.boolean().optional(),
	localIp: z.string().optional(),
	grpcPort: z.number().optional(),
	httpPort: z.number().optional(),
	isHosted: z.boolean().optional(),
	isPrincipal: z.boolean().optional(),
	lastInteractionAt: z.string().nullish(),
})

const traceRowSchema = z.looseObject({
	id: z.string().min(1),
	createdAt: z.string(),
	updatedAt: z.string(),
})

export const identitiesResponseSchema = z.object({
	identities: z.array(z.object({ domiaKey: z.string().min(1) })),
})

export const syncResponseSchema = z.object({
	interactions: z.array(traceRowSchema),
	sessions: z.array(traceRowSchema),
	emotionEvents: z.array(traceRowSchema),
	facts: z.array(traceRowSchema),
	nextCursor: z.string(),
})
