import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import {
	announceToDomia,
	announceAudioToDomia,
	setRoomIntercom,
	cancelRoomTurn,
} from "@/services/rooms"
import { assertWritable } from "@/lib/demo"

export const announce = createServerFn({ method: "POST" })
	.validator(
		z.object({
			domiaKey: z.string().min(1),
			text: z.string().min(1),
			broadcastId: z.string().min(1).optional(),
		}),
	)
	.handler(({ data }) => {
		assertWritable()
		return announceToDomia(data.domiaKey, data.text, data.broadcastId)
	})

export const announceAudio = createServerFn({ method: "POST" })
	.validator(
		z.object({
			domiaKey: z.string().min(1),
			audioBase64: z.string().min(1),
			mode: z.enum(["voice", "transcribe"]),
			broadcastId: z.string().min(1).optional(),
		}),
	)
	.handler(({ data }) => {
		assertWritable()
		return announceAudioToDomia(
			data.domiaKey,
			data.audioBase64,
			data.mode,
			data.broadcastId,
		)
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
