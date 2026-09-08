import type { ConfigField, FieldValue, JsonValue } from "@/types/config"

const stringDefault = (field: ConfigField): string =>
	typeof field.default === "string" ? field.default : ""

export const coerceFieldValue = (
	field: ConfigField,
	raw: unknown,
): FieldValue => {
	const value = raw === undefined ? field.default : raw
	switch (field.kind) {
		case "boolean":
			return Boolean(value)
		case "number":
		case "slider":
			if (value == null) return field.nullable ? "" : 0
			return Number(value)
		case "tags":
			return Array.isArray(value) ? value.map((v) => String(v)) : []
		case "json":
			return value == null ? "" : JSON.stringify(value, null, 2)
		case "secret":
			return ""
		default:
			return value == null ? stringDefault(field) : String(value)
	}
}

export const fieldValueToJson = (
	field: ConfigField,
	value: FieldValue,
): JsonValue | undefined => {
	switch (field.kind) {
		case "secret":
			return typeof value === "string" && value !== "" ? value : undefined
		case "json": {
			const text = typeof value === "string" ? value.trim() : ""
			if (!text) return null
			try {
				return JSON.parse(text) as JsonValue
			} catch {
				return undefined
			}
		}
		case "number":
		case "slider":
			if (value === "" || value == null) return null
			return Number(value)
		case "tags":
			return Array.isArray(value) ? value : []
		case "boolean":
			return Boolean(value)
		default:
			if (value === "" && field.nullable) return null
			return String(value)
	}
}
