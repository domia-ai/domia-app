import type {
	ConfigField,
	ConfigFieldKind,
	ConfigFieldMetaEntry,
	ConfigSchema,
	ConfigSchemaField,
	ConfigSchemaSection,
	ConfigSectionDef,
	ConfigSectionFieldMeta,
	ConfigSectionMeta,
} from "@/types/config"

export const humanizeKey = (key: string): string =>
	key
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/_/g, " ")
		.replace(/\bms\b/gi, "(ms)")
		.replace(/^./, (c) => c.toUpperCase())

const isHidden = (
	hidden: Record<string, readonly string[]>,
	source: string,
	key: string,
): boolean =>
	(hidden["*"] ?? []).includes(key) || (hidden[source] ?? []).includes(key)

const kindFor = (
	field: ConfigSchemaField,
	meta: ConfigFieldMetaEntry | undefined,
): ConfigFieldKind => {
	if (field.secret) return "secret"
	if (meta?.kind) return meta.kind
	if (field.type === "boolean") return "boolean"
	if (field.type === "enum") return "select"
	if (field.type === "number") return "number"
	if (field.type === "json") return "json"
	return "text"
}

const toField = (
	field: ConfigSchemaField,
	meta: ConfigFieldMetaEntry | undefined,
	advanced: boolean,
): ConfigField => {
	const kind = kindFor(field, meta)
	const options =
		field.type === "enum" && field.enumValues?.length
			? field.enumValues
			: meta?.options
	return {
		key: field.key,
		label: meta?.label ?? (() => humanizeKey(field.key)),
		kind,
		...(options ? { options } : {}),
		...(meta?.optionLabels ? { optionLabels: meta.optionLabels } : {}),
		...(meta?.min != null ? { min: meta.min } : {}),
		...(meta?.max != null ? { max: meta.max } : {}),
		...(meta?.step != null ? { step: meta.step } : {}),
		...(meta?.unit ? { unit: meta.unit } : {}),
		...(meta?.stage ? { stage: meta.stage } : {}),
		...(meta?.hint ? { hint: meta.hint } : {}),
		...(meta?.readOnly ? { readOnly: true } : {}),
		advanced,
		nullable: field.nullable,
		default: field.default,
		schemaType: field.type,
	}
}

const orderFields = (
	schemaFields: ConfigSchemaField[],
	meta: ConfigSectionFieldMeta | undefined,
): ConfigField[] => {
	const byKey = new Map(schemaFields.map((f) => [f.key, f]))
	const placed = new Set<string>()
	const out: ConfigField[] = []
	const place = (entries: ConfigFieldMetaEntry[], advanced: boolean) => {
		for (const entry of entries) {
			const field = byKey.get(entry.key)
			if (!field || placed.has(entry.key)) continue
			placed.add(entry.key)
			out.push(toField(field, entry, entry.advanced ?? advanced))
		}
	}
	place(meta?.primary ?? [], false)
	place(meta?.advanced ?? [], true)
	for (const field of schemaFields)
		if (!placed.has(field.key)) out.push(toField(field, undefined, true))
	return out
}

const claimedBySiblings = (
	sectionMeta: ConfigSectionMeta[],
	self: ConfigSectionMeta,
): Set<string> => {
	const claimed = new Set<string>()
	for (const other of sectionMeta)
		if (other.id !== self.id && other.source === self.source && other.only)
			for (const key of other.only) claimed.add(key)
	return claimed
}

export const buildConfigSections = (
	schema: ConfigSchema,
	sectionMeta: ConfigSectionMeta[],
	fieldMeta: Record<string, ConfigSectionFieldMeta>,
	hidden: Record<string, readonly string[]>,
): ConfigSectionDef[] => {
	const schemaById = new Map<string, ConfigSchemaSection>(
		schema.sections.map((s) => [s.id, s]),
	)
	const covered = new Set<string>()
	const sections: ConfigSectionDef[] = []

	for (const meta of sectionMeta) {
		if (!meta.source) {
			sections.push({ ...meta, fields: [] })
			continue
		}
		const schemaSection = schemaById.get(meta.source)
		if (!schemaSection) continue
		covered.add(meta.source)
		const claimed = claimedBySiblings(sectionMeta, meta)
		const visible = schemaSection.fields.filter(
			(f) =>
				!isHidden(hidden, meta.source!, f.key) &&
				(meta.only ? meta.only.includes(f.key) : !claimed.has(f.key)),
		)
		const fields = orderFields(visible, fieldMeta[meta.source])
		if (fields.length === 0) continue
		sections.push({
			id: meta.id,
			label: meta.label,
			icon: meta.icon,
			group: meta.group,
			kind: meta.kind,
			source: meta.source,
			description: meta.description,
			fields,
		})
	}

	for (const schemaSection of schema.sections) {
		if (covered.has(schemaSection.id)) continue
		const visible = schemaSection.fields.filter(
			(f) => !isHidden(hidden, schemaSection.id, f.key),
		)
		if (visible.length === 0) continue
		sections.push({
			id: schemaSection.id,
			label: () => humanizeKey(schemaSection.id),
			icon: "sliders",
			group: "system",
			kind: "fields",
			source: schemaSection.id,
			fields: orderFields(visible, fieldMeta[schemaSection.id]),
		})
	}

	return sections
}

export const fieldMatches = (field: ConfigField, query: string): boolean =>
	field.label().toLowerCase().includes(query) ||
	field.key.toLowerCase().includes(query)
