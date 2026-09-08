import { useMemo, useState } from "react"
import { m } from "@/paraglide/messages"
import { validateField } from "@/utils/config-validation"
import { coerceFieldValue, fieldValueToJson } from "@/utils/config-values"
import {
	normalizeSkillProviders,
	skillProviderToBundle,
	skillProviderToSnapshot,
	skillProviderValid,
} from "@/utils/skill-providers"
import type {
	ConfigDraft,
	ConfigSectionDef,
	ConfigSnapshot,
	DraftImpact,
	FieldValue,
	JsonObject,
	JsonValue,
	SkillProviderDraft,
} from "@/types/config"

const SKILL_SECTION_ID = "skills"

const editableOf = (sections: ConfigSectionDef[]): ConfigSectionDef[] =>
	sections.filter((s) => s.kind === "fields")

const buildBaseline = (
	config: ConfigSnapshot,
	editable: ConfigSectionDef[],
): ConfigDraft => {
	const byKey = config as unknown as Record<
		string,
		Record<string, unknown> | null
	>
	const draft: ConfigDraft = {}
	for (const section of editable) {
		const src = byKey[section.source ?? section.id] ?? {}
		const values: Record<string, FieldValue> = {}
		for (const field of section.fields)
			values[field.key] = coerceFieldValue(field, src[field.key])
		draft[section.id] = values
	}
	return draft
}

const equal = (a: FieldValue, b: FieldValue): boolean => {
	if (Array.isArray(a) || Array.isArray(b))
		return JSON.stringify(a) === JSON.stringify(b)
	return a === b
}

export function useConfigDraft(
	config: ConfigSnapshot,
	sections: ConfigSectionDef[],
) {
	const editable = useMemo(() => editableOf(sections), [sections])
	const [baseline, setBaseline] = useState<ConfigDraft>(() =>
		buildBaseline(config, editable),
	)
	const [draft, setDraft] = useState<ConfigDraft>(() =>
		buildBaseline(config, editable),
	)
	const [skillBaseline, setSkillBaseline] = useState<SkillProviderDraft[]>(() =>
		normalizeSkillProviders(config.skillProviders),
	)
	const [skillProviders, setSkillProviders] = useState<SkillProviderDraft[]>(
		() => normalizeSkillProviders(config.skillProviders),
	)

	const sourceKey = (sectionId: string): string =>
		editable.find((s) => s.id === sectionId)?.source ?? sectionId

	const fieldOf = (sectionId: string, key: string) =>
		editable.find((s) => s.id === sectionId)?.fields.find((f) => f.key === key)

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

	const skillChanged = useMemo(
		() => JSON.stringify(skillProviders) !== JSON.stringify(skillBaseline),
		[skillProviders, skillBaseline],
	)

	const impact = useMemo((): DraftImpact => {
		const changedSections = editable
			.map((s) => {
				const base = baseline[s.id] ?? {}
				const cur = draft[s.id] ?? {}
				const changed = Object.keys(cur).filter((k) => !equal(cur[k], base[k]))
				return { section: s.id, label: s.label(), changed }
			})
			.filter((s) => s.changed.length > 0)
		if (skillChanged)
			changedSections.push({
				section: SKILL_SECTION_ID,
				label: m.config_section_skills(),
				changed: ["servers"],
			})
		return {
			totalChanged: changedSections.reduce((n, s) => n + s.changed.length, 0),
			sections: changedSections,
		}
	}, [baseline, draft, editable, skillChanged])

	const errors = useMemo((): Record<string, Record<string, string>> => {
		const map: Record<string, Record<string, string>> = {}
		for (const s of editable) {
			const cur = draft[s.id] ?? {}
			for (const field of s.fields) {
				const err = validateField(field, cur[field.key])
				if (err) (map[s.id] ??= {})[field.key] = err
			}
		}
		return map
	}, [draft, editable])

	const skillValid = skillProviders.every(skillProviderValid)
	const isValid = Object.keys(errors).length === 0 && skillValid

	const fieldError = (sectionId: string, key: string): string | null =>
		errors[sectionId]?.[key] ?? null

	const buildBundle = (): Record<string, unknown> => {
		const bundle: Record<string, unknown> = {}
		for (const s of impact.sections) {
			if (s.section === SKILL_SECTION_ID) continue
			const cur = draft[s.section] ?? {}
			const key = sourceKey(s.section)
			const fields = { ...((bundle[key] as JsonObject) ?? {}) }
			for (const k of s.changed) {
				const field = fieldOf(s.section, k)
				if (!field) continue
				const value = fieldValueToJson(field, cur[k])
				if (value !== undefined) fields[k] = value
			}
			if (Object.keys(fields).length) bundle[key] = fields
		}
		if (skillChanged)
			bundle.skillProviders = skillProviders.map(skillProviderToBundle)
		return bundle
	}

	const mergeInto = (base: ConfigSnapshot): ConfigSnapshot => {
		const byKey: Record<string, unknown> = {
			...(base as unknown as Record<string, unknown>),
		}
		for (const s of editable) {
			const key = s.source ?? s.id
			const merged: Record<string, JsonValue> = {
				...((byKey[key] as Record<string, JsonValue> | null) ?? {}),
			}
			const cur = draft[s.id] ?? {}
			for (const field of s.fields) {
				const value = fieldValueToJson(field, cur[field.key])
				if (value !== undefined) merged[field.key] = value
			}
			byKey[key] = merged
		}
		byKey.skillProviders = skillProviders.map(skillProviderToSnapshot)
		return byKey as unknown as ConfigSnapshot
	}

	const reset = () => {
		setDraft(baseline)
		setSkillProviders(skillBaseline)
	}
	const commit = () => {
		setBaseline(draft)
		setSkillBaseline(skillProviders)
	}

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
		skillProviders,
		setSkillProviders,
		skillChanged,
	}
}

export type ConfigDraftApi = ReturnType<typeof useConfigDraft>
