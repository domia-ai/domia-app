import type { ConfigField, FieldValue } from "@/types/config"

export function validateField(
	field: ConfigField,
	value: FieldValue,
): string | null {
	if (field.kind === "number" || field.kind === "slider") {
		const n = typeof value === "number" ? value : Number(value)
		if (!Number.isFinite(n)) return "Must be a number"
		if (field.min != null && n < field.min)
			return `Must be ≥ ${field.min}${field.unit ? ` ${field.unit}` : ""}`
		if (field.max != null && n > field.max)
			return `Must be ≤ ${field.max}${field.unit ? ` ${field.unit}` : ""}`
	}
	return null
}
