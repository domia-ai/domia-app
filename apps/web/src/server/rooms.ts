import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import {
	getRoomPresence,
	broadcastToRooms,
	announceToDomia,
	setRoomIntercom,
	cancelRoomTurn,
} from "@/services/rooms"
import { assertWritable } from "@/lib/demo"

export const roomPresence = createServerFn({ method: "GET" })
	.validator(z.object({ hostDomiaKey: z.string().min(1) }))
	.handler(({ data }) => getRoomPresence(data.hostDomiaKey))

export const broadcast = createServerFn({ method: "POST" })
	.validator(
		z.object({ hostDomiaKey: z.string().min(1), text: z.string().min(1) }),
	)
	.handler(({ data }) => {
		assertWritable()
		return broadcastToRooms(data.hostDomiaKey, data.text)
	})

export const announce = createServerFn({ method: "POST" })
	.validator(z.object({ domiaKey: z.string().min(1), text: z.string().min(1) }))
	.handler(({ data }) => {
		assertWritable()
		return announceToDomia(data.domiaKey, data.text)
	})

export const intercom = createServerFn({ method: "POST" })
	.validator(
		z.object({
			hostDomiaKey: z.string().min(1),
			from: z.string().min(1),
			to: z.string().min(1).nullable(),
		}),
	)
	.handler(({ data }) => {
		assertWritable()
		return setRoomIntercom(data.hostDomiaKey, data.from, data.to)
	})

export const cancelTurn = createServerFn({ method: "POST" })
	.validator(
		z.object({
			hostDomiaKey: z.string().min(1),
			domiaKey: z.string().min(1),
		}),
	)
	.handler(({ data }) => {
		assertWritable()
		return cancelRoomTurn(data.hostDomiaKey, data.domiaKey)
	})
