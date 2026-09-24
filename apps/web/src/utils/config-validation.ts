import { m } from "@/paraglide/messages"
import { unitLabel } from "@/utils/config"
import type { BoundedIntRule, ConfigField, FieldValue } from "@/types/config"

export function validateField(
	field: ConfigField,
	value: FieldValue,
): string | null {
	if (field.kind === "number" || field.kind === "slider") {
		if (value === "" && field.nullable) return null
		const n = typeof value === "number" ? value : Number(value)
		if (!Number.isFinite(n)) return m.err_must_be_number()
		const unit = field.unit ? ` ${field.unit}` : ""
		if (field.min != null && n < field.min)
			return m.err_min_value({ min: `${field.min}${unit}` })
		if (field.max != null && n > field.max)
			return m.err_max_value({ max: `${field.max}${unit}` })
	}
	if (field.kind === "json") {
		const text = typeof value === "string" ? value.trim() : ""
		if (!text) return null
		try {
			JSON.parse(text)
		} catch {
			return m.err_invalid_json()
		}
	}
	return null
}

export function validateBoundedInt(
	raw: string,
	rule: BoundedIntRule,
): string | null {
	const text = raw.trim()
	if (text.length === 0) return m.err_field_required()
	const n = Number(text)
	if (!Number.isFinite(n)) return m.err_must_be_number()
	if (!Number.isInteger(n)) return m.err_must_be_integer()
	const suffix = rule.unit ? ` ${unitLabel(rule.unit)}` : ""
	if (n < rule.min) return m.err_min_value({ min: `${rule.min}${suffix}` })
	if (n > rule.max) return m.err_max_value({ max: `${rule.max}${suffix}` })
	return null
}

export function validateOptionalHttpUrl(
	raw: string,
	maxChars: number,
): string | null {
	const text = raw.trim()
	if (text.length === 0) return null
	if (text.length > maxChars) return m.err_max_length({ max: maxChars })
	try {
		if (!/^https?:$/.test(new URL(text).protocol)) return m.err_invalid_url()
	} catch {
		return m.err_invalid_url()
	}
	return null
}
