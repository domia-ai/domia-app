import { z } from "zod"
import { m } from "@/paraglide/messages"

export const buildBindSatelliteFormSchema = () =>
	z.object({
		targetKey: z.string().min(1, m.err_pick_room()),
		encryptionKey: z.string(),
	})

export const buildDiscoverSatelliteFormSchema = () =>
	z.object({
		deviceId: z.string().min(1, m.err_field_required()),
		encryptionKey: z.string(),
	})

export const buildAddLivekitSatelliteFormSchema = () =>
	z.object({
		satelliteId: z.string().trim().min(1, m.err_field_required()).max(200),
		name: z.string().trim().max(120),
		host: z.string().trim().min(1, m.err_field_required()).max(200),
		port: z.number().int().positive().max(65535),
		room: z.string().trim().min(1, m.err_field_required()).max(200),
		apiKey: z.string().trim().min(1, m.err_field_required()).max(200),
		apiSecret: z.string().trim().min(1, m.err_field_required()).max(200),
	})

export const buildAddIdentityFormSchema = () =>
	z.object({
		name: z.string().trim().min(1, m.err_name_required()).max(80),
	})
