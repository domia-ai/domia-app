import { useMemo, useState } from "react"
import { CONFIG_SECTIONS } from "@/constants/config"
import { validateField } from "@/utils/config-validation"
import type {
	ConfigDraft,
	ConfigField,
	ConfigSnapshot,
	DraftImpact,
	FieldValue,
} from "@/types/config"

const EDITABLE = CONFIG_SECTIONS.filter(
	(s) => s.kind === "fields" || s.kind === "radar",
)

const sourceKey = (sectionId: string): string =>
	EDITABLE.find((s) => s.id === sectionId)?.source ?? sectionId

const coerce = (field: ConfigField, raw: unknown): FieldValue => {
	if (field.kind === "boolean") return Boolean(raw)
	if (field.kind === "number" || field.kind === "slider")
		return raw == null ? 0 : Number(raw)
	if (field.kind === "tags")
		return Array.isArray(raw) ? raw.map((v) => String(v)) : []
	return raw == null ? "" : String(raw)
}

const buildBaseline = (config: ConfigSnapshot): ConfigDraft => {
	const byKey = config as unknown as Record<
		string,
		Record<string, unknown> | null
	>
	const draft: ConfigDraft = {}
	for (const section of EDITABLE) {
		const src = byKey[section.source ?? section.id] ?? {}
		const values: Record<string, FieldValue> = {}
		for (const field of section.fields)
			values[field.key] = coerce(field, src[field.key])
		draft[section.id] = values
	}
	return draft
}

const equal = (a: FieldValue, b: FieldValue): boolean => {
	if (Array.isArray(a) || Array.isArray(b))
		return JSON.stringify(a) === JSON.stringify(b)
	return a === b
}

export function useConfigDraft(config: ConfigSnapshot) {
	const [baseline, setBaseline] = useState<ConfigDraft>(() =>
		buildBaseline(config),
	)
	const [draft, setDraft] = useState<ConfigDraft>(() => buildBaseline(config))

	const setField = (sectionId: string, key: string, value: FieldValue) =>
		setDraft((prev) => ({
			...prev,
			[sectionId]: { ...prev[sectionId], [key]: value },
		}))

	const setSectionValues = (
		sectionId: string,
		values: Record<string, FieldValue>,
	) =>
		setDraft((prev) => ({
			...prev,
			[sectionId]: { ...prev[sectionId], ...values },
		}))

	const changedKeys = (sectionId: string): string[] => {
		const base = baseline[sectionId] ?? {}
		const cur = draft[sectionId] ?? {}
		return Object.keys(cur).filter((k) => !equal(cur[k], base[k]))
	}

	const impact = useMemo((): DraftImpact => {
		const sections = EDITABLE.map((s) => {
			const base = baseline[s.id] ?? {}
			const cur = draft[s.id] ?? {}
			const changed = Object.keys(cur).filter((k) => !equal(cur[k], base[k]))
			return { section: s.id, label: s.label, changed }
		}).filter((s) => s.changed.length > 0)
		return {
			totalChanged: sections.reduce((n, s) => n + s.changed.length, 0),
			sections,
		}
	}, [baseline, draft])

	const errors = useMemo((): Record<string, Record<string, string>> => {
		const map: Record<string, Record<string, string>> = {}
		for (const s of EDITABLE) {
			const cur = draft[s.id] ?? {}
			for (const field of s.fields) {
				const err = validateField(field, cur[field.key])
				if (err) (map[s.id] ??= {})[field.key] = err
			}
		}
		return map
	}, [draft])

	const isValid = Object.keys(errors).length === 0

	const fieldError = (sectionId: string, key: string): string | null =>
		errors[sectionId]?.[key] ?? null

	const buildBundle = (): Record<string, Record<string, FieldValue>> => {
		const bundle: Record<string, Record<string, FieldValue>> = {}
		for (const s of impact.sections) {
			const cur = draft[s.section] ?? {}
			const fields: Record<string, FieldValue> = {}
			for (const key of s.changed) fields[key] = cur[key]
			bundle[sourceKey(s.section)] = fields
		}
		return bundle
	}

	const mergeInto = (base: ConfigSnapshot): ConfigSnapshot => {
		const byKey: Record<string, unknown> = {
			...(base as unknown as Record<string, unknown>),
		}
		for (const s of EDITABLE) {
			const key = s.source ?? s.id
			byKey[key] = {
				...((byKey[key] as Record<string, unknown> | null) ?? {}),
				...(draft[s.id] ?? {}),
			}
		}
		return byKey as unknown as ConfigSnapshot
	}

	const reset = () => setDraft(baseline)
	const commit = () => setBaseline(draft)

	return {
		draft,
		setField,
		setSectionValues,
		changedKeys,
		impact,
		errors,
		isValid,
		fieldError,
		buildBundle,
		mergeInto,
		reset,
		commit,
	}
}

export type ConfigDraftApi = ReturnType<typeof useConfigDraft>
