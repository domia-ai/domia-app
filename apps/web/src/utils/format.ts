import { format, formatDistanceToNowStrict } from "date-fns"
import { es } from "date-fns/locale"
import { m } from "@/paraglide/messages"
import { getLocale } from "@/paraglide/runtime"

const distanceLocale = () => (getLocale() === "es" ? es : undefined)

export const fromSqliteTs = (ts: string | null): Date | null => {
	if (!ts) return null
	const norm = ts.includes("T") ? ts : ts.replace(" ", "T") + "Z"
	const d = new Date(norm)
	return Number.isNaN(d.getTime()) ? null : d
}

export const toSqliteTs = (ms: number): string =>
	new Date(ms).toISOString().slice(0, 19).replace("T", " ")

export const relativeTime = (ts: string | null): string => {
	const d = fromSqliteTs(ts)
	if (!d) return "—"
	if (Date.now() - d.getTime() < 30_000) return m.time_just_now()
	return formatDistanceToNowStrict(d, {
		addSuffix: true,
		locale: distanceLocale(),
	})
}

export const relativeTimeMs = (ms: number): string => {
	if (Date.now() - ms < 30_000) return m.time_just_now()
	return formatDistanceToNowStrict(new Date(ms), {
		addSuffix: true,
		locale: distanceLocale(),
	})
}

export const formatTs = (
	ts: string | null,
	pattern = "MMM d, HH:mm",
): string => {
	const d = fromSqliteTs(ts)
	return d ? format(d, pattern) : "—"
}

export const formatMaybeJson = (value: unknown): string | null => {
	if (value == null) return null
	if (typeof value === "string") return value
	try {
		return JSON.stringify(value, null, 2)
	} catch {
		return String(value)
	}
}

export const clock = (seconds: number): string =>
	`${Math.floor(seconds / 60)}:${Math.round(seconds % 60)
		.toString()
		.padStart(2, "0")}`

export const formatMs = (ms: number | null): string => {
	if (ms == null) return "—"
	return ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`
}

export const formatBytes = (bytes: number | null): string => {
	if (!bytes) return "—"
	const kb = bytes / 1024
	return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`
}
