import { m } from "@/paraglide/messages"
import type { ConfigField, FieldValue } from "@/types/config"

export function validateField(
	field: ConfigField,
	value: FieldValue,
): string | null {
	if (field.kind === "number" || field.kind === "slider") {
		const n = typeof value === "number" ? value : Number(value)
		if (!Number.isFinite(n)) return m.err_must_be_number()
		const unit = field.unit ? ` ${field.unit}` : ""
		if (field.min != null && n < field.min)
			return m.err_min_value({ min: `${field.min}${unit}` })
		if (field.max != null && n > field.max)
			return m.err_max_value({ max: `${field.max}${unit}` })
	}
	return null
}
