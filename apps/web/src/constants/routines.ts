import type { FastPathSlotKind } from "@/types/routines"

export const ROUTINE_SLUG_PATTERN = /^[a-z0-9_]{1,40}$/
export const ROUTINE_TOOL_PREFIX = "routine_"
export const ROUTINE_MAX_STEPS = 8
export const ROUTINE_MAX_NAME_CHARS = 120
export const ROUTINE_MAX_DESCRIPTION_CHARS = 500
export const ROUTINE_MAX_PHRASES_PER_LOCALE = 50
export const ROUTINE_MAX_PHRASE_CHARS = 200
export const ROUTINE_MAX_REPLY_CHARS = 300
export const ROUTINE_MAX_TOOL_CHARS = 200
export const ROUTINE_MAX_SLOT_VALUES = 50
export const ROUTINE_TRY_MAX_CHARS = 500

export const FAST_PATH_SLOT_KINDS: readonly FastPathSlotKind[] = [
	"enum",
	"map",
	"schemaEnum",
	"range",
	"duration",
	"clockTime",
	"context",
]

export const ROUTINE_UNSUPPORTED_SLOT_KINDS: readonly FastPathSlotKind[] = [
	"context",
	"schemaEnum",
]
