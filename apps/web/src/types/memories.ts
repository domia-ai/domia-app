import type { MemoryFactRow as DbMemoryFactRow } from "@domia-app/db"

export type MemoryFactRow = DbMemoryFactRow & {
	domiaName: string | null
	domiaAvatarId: string | null
}
