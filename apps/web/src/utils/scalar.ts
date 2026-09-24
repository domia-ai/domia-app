import type { JsonValue } from "@/types/config"
import type { RoutineArgRow } from "@/types/routines"

const NUMERIC = /^-?\d+(\.\d+)?$/
const QUOTED = /^"(.*)"$/s

export const parseScalar = (raw: string): JsonValue => {
	const text = raw.trim()
	const quoted = QUOTED.exec(text)
	if (quoted) return quoted[1]
	if (text === "true") return true
	if (text === "false") return false
	if (NUMERIC.test(text) && Number.isFinite(Number(text))) return Number(text)
	return raw
}

export const scalarText = (value: JsonValue): string => {
	if (typeof value === "string")
		return parseScalar(value) === value ? value : `"${value}"`
	return JSON.stringify(value)
}

export const argsFromRows = (
	rows: RoutineArgRow[],
): Record<string, JsonValue> =>
	Object.fromEntries(
		rows
			.map(([key, vals]): [string, JsonValue] => [
				key.trim(),
				vals.length === 0
					? ""
					: vals.length === 1
						? parseScalar(vals[0])
						: vals.map(parseScalar),
			])
			.filter(([key]) => key !== ""),
	)

export const argRowsOf = (args: Record<string, JsonValue>): RoutineArgRow[] =>
	Object.entries(args).map(([key, value]) => [
		key,
		Array.isArray(value)
			? value.map(scalarText)
			: value === "" || value === null
				? []
				: [scalarText(value)],
	])

export const duplicateKeys = (rows: [string, unknown][]): Set<string> => {
	const seen = new Set<string>()
	const dupes = new Set<string>()
	for (const [key] of rows) {
		const name = key.trim()
		if (name === "") continue
		if (seen.has(name)) dupes.add(name)
		seen.add(name)
	}
	return dupes
}
