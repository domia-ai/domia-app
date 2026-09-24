import { readFile, writeFile } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { format, resolveConfig } from "prettier"
import type {
	ConfigSchema,
	ConfigSchemaField,
	ConfigSchemaSection,
} from "@/types/config"

const SNAPSHOT_PATH = fileURLToPath(
	new URL("../src/constants/config-schema-snapshot.json", import.meta.url),
)

const hostOf = (url: string): string => {
	try {
		return new URL(url).host
	} catch {
		return "invalid-url"
	}
}

const fetchSchema = async (): Promise<ConfigSchema> => {
	const url = process.env.SCHEMA_URL
	if (!url) throw new Error("SCHEMA_URL is required")
	const secret = process.env.DOMIA_MESH_SECRET
	if (!secret) throw new Error("DOMIA_MESH_SECRET is required")
	const res = await fetch(url, {
		headers: { authorization: `Bearer ${secret}` },
	}).catch(() => {
		throw new Error(`schema fetch failed: ${hostOf(url)} unreachable`)
	})
	if (!res.ok)
		throw new Error(`schema fetch failed: ${res.status} from ${hostOf(url)}`)
	const parsed = (await res.json()) as ConfigSchema
	if (parsed?.scalarSectionsOnly !== true)
		throw new Error(`schema from ${hostOf(url)} is not scalarSectionsOnly`)
	if (!Array.isArray(parsed.sections) || parsed.sections.length === 0)
		throw new Error(`schema from ${hostOf(url)} has no sections`)
	for (const section of parsed.sections)
		if (!Array.isArray(section.fields) || section.fields.length === 0)
			throw new Error(`schema section ${section.id} has no fields`)
	return parsed
}

const serialize = async (schema: ConfigSchema): Promise<string> => {
	const options = await resolveConfig(SNAPSHOT_PATH)
	return format(JSON.stringify(schema, null, "\t"), {
		...options,
		useTabs: true,
		filepath: SNAPSHOT_PATH,
		parser: "json",
	})
}

const readSnapshot = async (): Promise<{
	raw: string
	schema: ConfigSchema
}> => {
	const raw = await readFile(SNAPSHOT_PATH, "utf8")
	return { raw, schema: JSON.parse(raw) as ConfigSchema }
}

const sectionMap = (
	schema: ConfigSchema,
): Map<string, Map<string, ConfigSchemaField>> => {
	const out = new Map<string, Map<string, ConfigSchemaField>>()
	for (const section of schema.sections)
		out.set(section.id, new Map(section.fields.map((f) => [f.key, f] as const)))
	return out
}

const fieldShape = (field: ConfigSchemaField): string =>
	JSON.stringify({
		column: field.column,
		type: field.type,
		default: field.default,
		enumValues: field.enumValues ?? null,
		nullable: field.nullable,
		secret: field.secret ?? false,
	})

const diffSection = (
	id: string,
	current: Map<string, ConfigSchemaField>,
	next: Map<string, ConfigSchemaField>,
	lines: string[],
): void => {
	for (const [key, field] of next)
		if (!current.has(key))
			lines.push(`+ field ${id}.${key} ${fieldShape(field)}`)
	for (const [key, field] of current)
		if (!next.has(key)) lines.push(`- field ${id}.${key} ${fieldShape(field)}`)
	for (const [key, field] of next) {
		const before = current.get(key)
		if (!before) continue
		if (fieldShape(before) === fieldShape(field)) continue
		lines.push(`~ field ${id}.${key}`)
		lines.push(`    snapshot ${fieldShape(before)}`)
		lines.push(`    live     ${fieldShape(field)}`)
	}
}

const diff = (current: ConfigSchema, next: ConfigSchema): string[] => {
	const lines: string[] = []
	const currentSections = sectionMap(current)
	const nextSections = sectionMap(next)
	const tableOf = (schema: ConfigSchema, id: string) =>
		schema.sections.find((s: ConfigSchemaSection) => s.id === id)?.table
	for (const id of nextSections.keys())
		if (!currentSections.has(id))
			lines.push(
				`+ section ${id} (table ${tableOf(next, id)}, ${nextSections.get(id)?.size} fields)`,
			)
	for (const id of currentSections.keys())
		if (!nextSections.has(id))
			lines.push(
				`- section ${id} (table ${tableOf(current, id)}, ${currentSections.get(id)?.size} fields)`,
			)
	for (const [id, nextFields] of nextSections) {
		const currentFields = currentSections.get(id)
		if (!currentFields) continue
		if (tableOf(current, id) !== tableOf(next, id))
			lines.push(
				`~ section ${id} table ${tableOf(current, id)} → ${tableOf(next, id)}`,
			)
		diffSection(id, currentFields, nextFields, lines)
	}
	return lines
}

const run = async (): Promise<void> => {
	const live = await fetchSchema()
	if (!process.argv.includes("--check")) {
		await writeFile(SNAPSHOT_PATH, await serialize(live), "utf8")
		const fields = live.sections.reduce((n, s) => n + s.fields.length, 0)
		console.log(
			`config schema snapshot written: ${live.sections.length} sections, ${fields} fields`,
		)
		return
	}
	const { raw, schema } = await readSnapshot()
	const lines = diff(schema, live)
	if ((await serialize(schema)) !== raw)
		lines.push("~ snapshot file is not tab-indented, prettier-formatted JSON")
	if (lines.length === 0) {
		console.log("config schema snapshot is up to date")
		return
	}
	console.error(`config schema drift (${lines.length}):`)
	for (const line of lines) console.error(line)
	console.error("run: npm run -w apps/web sync:config-schema")
	process.exitCode = 1
}

await run().catch((error: unknown) => {
	console.error(error instanceof Error ? error.message : String(error))
	process.exitCode = 1
})
