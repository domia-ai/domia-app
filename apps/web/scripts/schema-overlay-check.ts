import assert from "node:assert/strict"
import { CONFIG_SCHEMA_SNAPSHOT } from "@/constants/config-schema"
import { FIELD_META, HIDDEN_FIELDS, SECTION_META } from "@/constants/config"
import { buildConfigSections, humanizeKey } from "@/utils/config-schema"
import type { ConfigSchema, ConfigSchemaField } from "@/types/config"

const must = <T>(value: T | undefined, what: string): T => {
	assert.ok(value !== undefined, `${what} must exist`)
	return value
}

const field = (
	key: string,
	extra: Partial<ConfigSchemaField> = {},
): ConfigSchemaField => ({
	key,
	column: key,
	type: "string",
	default: null,
	nullable: false,
	secret: false,
	...extra,
})

const loadSourceSchema = async (): Promise<ConfigSchema> => {
	const url = process.env.SCHEMA_URL
	if (!url) return CONFIG_SCHEMA_SNAPSHOT
	const secret = process.env.DOMIA_MESH_SECRET
	const res = await fetch(url, {
		headers: secret ? { authorization: `Bearer ${secret}` } : {},
	})
	if (!res.ok) throw new Error(`SCHEMA_URL fetch failed (${res.status})`)
	const parsed = (await res.json()) as ConfigSchema
	if (!Array.isArray(parsed?.sections) || parsed.sections.length === 0)
		throw new Error("SCHEMA_URL returned no sections")
	return parsed
}

const metaKeysOf = (section: string): Set<string> => {
	const meta = FIELD_META[section]
	if (!meta) return new Set()
	return new Set([...meta.primary, ...meta.advanced].map((f) => f.key))
}
const hiddenSetOf = (section: string): Set<string> =>
	new Set([...(HIDDEN_FIELDS["*"] ?? []), ...(HIDDEN_FIELDS[section] ?? [])])

const EXPECTED_SECTION_IDS = [
	"domia",
	"character",
	"modules",
	"capabilities",
	"stt",
	"tts",
	"llm",
	"wakeWord",
	"playback",
	"mqttLocal",
]

const source = await loadSourceSchema()

assert.equal(
	source.scalarSectionsOnly,
	true,
	"live schema must be scalarSectionsOnly",
)
assert.deepEqual(
	[...source.sections.map((s) => s.id)].sort(),
	[...EXPECTED_SECTION_IDS].sort(),
	"live schema must expose exactly the 10 scalar sections",
)
assert.ok(
	!source.sections.some((s) => s.id === "emotion"),
	"live schema must not carry an emotion section",
)
const domiaSchema = must(
	source.sections.find((s) => s.id === "domia"),
	"domia schema section",
)
for (const banned of ["name", "isActive", "configRevision"])
	assert.ok(
		!domiaSchema.fields.some((f) => f.key === banned),
		`domia schema must not expose ${banned}`,
	)
for (const s of source.sections)
	for (const f of s.fields)
		for (const banned of ["isActive", "configRevision"])
			assert.notEqual(
				f.key,
				banned,
				`${s.id}.${banned} must not be in the schema`,
			)

const uncovered: string[] = []
for (const s of source.sections)
	for (const f of s.fields)
		if (!metaKeysOf(s.id).has(f.key) && !hiddenSetOf(s.id).has(f.key))
			uncovered.push(`${s.id}.${f.key}`)
assert.equal(
	uncovered.length,
	0,
	`schema fields without a FIELD_META label or a HIDDEN_FIELDS entry: ${uncovered.join(", ")}`,
)

const schema: ConfigSchema = structuredClone(CONFIG_SCHEMA_SNAPSHOT)
const sectionOf = (id: string) =>
	must(
		schema.sections.find((s) => s.id === id),
		`schema section ${id}`,
	)
sectionOf("llm").fields.push(
	field("brandNewKnobMs", { type: "number", default: 250 }),
)
sectionOf("tts").fields.push(
	field("futureEngineMode", {
		type: "enum",
		default: "alpha",
		enumValues: ["alpha", "beta"],
	}),
)
sectionOf("tts").fields.push(
	field("engine", {
		type: "enum",
		default: "KOKORO",
		enumValues: ["KOKORO", "NEW_ENGINE"],
	}),
)
sectionOf("tts").fields.splice(
	sectionOf("tts").fields.findIndex((f) => f.key === "engine"),
	1,
)
schema.sections.push({
	id: "speechEnhancer",
	table: "speech_enhancer_config",
	fields: [
		field("enabled", { type: "boolean", default: false }),
		field("apiKey", { secret: true, nullable: true }),
	],
})

const sections = buildConfigSections(
	schema,
	SECTION_META,
	FIELD_META,
	HIDDEN_FIELDS,
)
const schemaFieldOf = (source: string, key: string) =>
	must(
		sectionOf(source).fields.find((f) => f.key === key),
		`schema field ${source}.${key}`,
	)
const isHidden = (source: string, key: string) =>
	(HIDDEN_FIELDS["*"] ?? []).includes(key) ||
	(HIDDEN_FIELDS[source] ?? []).includes(key)
const consoleFieldOf = (sectionId: string, key: string) =>
	must(
		must(
			sections.find((s) => s.id === sectionId),
			`console section ${sectionId}`,
		).fields.find((f) => f.key === key),
		`console field ${sectionId}.${key}`,
	)

let total = 0
let reachable = 0
let hidden = 0
for (const s of schema.sections)
	for (const f of s.fields) {
		total++
		const hits = sections.filter(
			(sec) => sec.source === s.id && sec.fields.some((x) => x.key === f.key),
		)
		const isH = isHidden(s.id, f.key)
		assert.ok(
			hits.length > 0 || isH,
			`${s.id}.${f.key} is neither reachable nor explicitly hidden`,
		)
		assert.ok(!(hits.length > 0 && isH), `${s.id}.${f.key} hidden but rendered`)
		assert.ok(
			hits.length <= 1,
			`${s.id}.${f.key} rendered in ${hits.length} sections`,
		)
		if (isH) hidden++
		else reachable++
	}
assert.equal(reachable + hidden, total)

for (const sec of sections)
	for (const f of sec.fields) {
		const sf = schemaFieldOf(must(sec.source, `${sec.id} source`), f.key)
		if (sf.type === "enum") {
			assert.equal(
				f.kind,
				"select",
				`${sec.id}.${f.key} enum must render as select`,
			)
			assert.deepEqual(
				[...must(f.options, `${sec.id}.${f.key} options`)],
				sf.enumValues,
				`${sec.id}.${f.key} options must come from the schema`,
			)
		} else if (f.options)
			assert.fail(
				`${sec.id}.${f.key} carries options the schema does not declare: ${f.options.join(",")}`,
			)
		if (sf.secret)
			assert.equal(f.kind, "secret", `${sec.id}.${f.key} must render as secret`)
	}

const ttsEngine = consoleFieldOf("tts", "engine")
assert.deepEqual(
	[...must(ttsEngine.options, "tts engine options")],
	["KOKORO", "NEW_ENGINE"],
)
const sttEngine = consoleFieldOf("stt", "engine")
assert.deepEqual(
	[...must(sttEngine.options, "stt engine options")],
	schemaFieldOf("stt", "engine").enumValues,
)

const knob = consoleFieldOf("llm", "brandNewKnobMs")
assert.equal(knob.label(), "Brand New Knob (ms)")
assert.equal(knob.kind, "number")
assert.equal(knob.advanced, true)
assert.equal(knob.default, 250)
const mode = consoleFieldOf("tts", "futureEngineMode")
assert.equal(mode.label(), "Future Engine Mode")
assert.deepEqual(
	[...must(mode.options, "futureEngineMode options")],
	["alpha", "beta"],
)

const enhancer = must(
	sections.find((s) => s.source === "speechEnhancer"),
	"speechEnhancer console section",
)
assert.equal(enhancer.label(), "Speech Enhancer")
assert.equal(enhancer.group, "system")
assert.deepEqual(
	enhancer.fields.map((f) => f.key),
	["enabled", "apiKey"],
)
assert.equal(enhancer.fields[1].kind, "secret")

assert.ok(
	!sections.some((s) => s.id === "identity"),
	"console must not build a schema-driven identity section",
)
for (const id of EXPECTED_SECTION_IDS)
	assert.ok(
		sections.some((s) => s.source === id),
		`schema section ${id} must map to a console section`,
	)
const advanced = must(
	sections.find((s) => s.id === "advanced"),
	"advanced console section",
)
assert.ok(
	!advanced.fields.some((f) => f.key === "name"),
	"advanced must not expose a name field",
)
for (const key of HIDDEN_FIELDS.domia)
	assert.ok(
		!advanced.fields.some((f) => f.key === key),
		`${key} must stay hidden`,
	)
assert.ok(
	!HIDDEN_FIELDS.domia.includes("meshSecretGraceMs"),
	"meshSecretGraceMs is edited from the mesh rotation card and must not be hidden",
)
assert.ok(
	advanced.fields.some((f) => f.key === "meshSecretGraceMs"),
	"meshSecretGraceMs must render in the advanced section",
)

for (const src of ["stt", "tts", "wakeWord"]) {
	const provider = consoleFieldOf(src, "provider")
	assert.equal(
		provider.kind,
		"text",
		`${src}.provider is a free string in the schema`,
	)
	assert.equal(provider.options, undefined)
}

assert.equal(humanizeKey("sessionIdTimeoutMs"), "Session Id Timeout (ms)")
assert.equal(
	humanizeKey("rule1MinTrailingSilence"),
	"Rule1 Min Trailing Silence",
)

console.log(
	`schema overlay ok: ${schema.sections.length} sections, ${total} schema fields → ${reachable} reachable + ${hidden} hidden, ${sections.length} console sections`,
)
