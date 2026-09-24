import { z } from "zod"
import { m } from "@/paraglide/messages"

export const buildModelInstallSpecSchema = () => {
	const safeName = z
		.string()
		.min(1)
		.max(200)
		.regex(/^[A-Za-z0-9._-]+$/, m.modelspec_err_safe_name())
	const ollamaName = z
		.string()
		.min(1)
		.max(200)
		.regex(/^[A-Za-z0-9._:/-]+$/, m.modelspec_err_ollama_name())
	const httpUrl = z
		.url(m.modelspec_err_http_url())
		.refine((u) => /^https?:\/\//.test(u), m.modelspec_err_http_url())
	const sha256Hex = z
		.string()
		.regex(/^[A-Fa-f0-9]{64}$/, m.modelspec_err_sha256())
	const sizeBytes = z.number().int().positive()
	const common = {
		label: z.string().max(120).optional(),
		stage: z.string().max(40).optional(),
		license: z.string().min(1).max(200).optional(),
	}

	return z.discriminatedUnion("kind", [
		z.object({
			...common,
			kind: z.literal("sherpa-archive"),
			url: httpUrl,
			subdir: safeName.optional(),
			target: safeName,
			sourceDir: safeName.optional(),
			sha256: sha256Hex.optional(),
			sizeBytes: sizeBytes.optional(),
		}),
		z.object({
			...common,
			kind: z.literal("file"),
			url: httpUrl,
			subdir: safeName.optional(),
			target: safeName,
			sha256: sha256Hex.optional(),
			sizeBytes: sizeBytes.optional(),
		}),
		z.object({
			...common,
			kind: z.literal("ollama"),
			model: ollamaName,
		}),
	])
}

export const parseModelInstallSpec = (
	value: unknown,
):
	| { ok: true; spec: Record<string, unknown> }
	| { ok: false; error: string } => {
	const parsed = buildModelInstallSpecSchema().safeParse(value)
	if (parsed.success)
		return { ok: true, spec: parsed.data as Record<string, unknown> }
	const first = parsed.error.issues[0]
	return {
		ok: false,
		error: first
			? `${first.path.join(".") || "spec"}: ${first.message}`
			: m.modelspec_err_invalid(),
	}
}
