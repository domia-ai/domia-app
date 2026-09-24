import type { ReactNode } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import type { FilterFacetOption, Paginated, TableParams } from "@/types/table"
import type {
	MemoryEpisodeRow as DbMemoryEpisodeRow,
	MemoryFactRow as DbMemoryFactRow,
	UserModelRow as DbUserModelRow,
} from "@domia-app/db"

export type MemoryFactRow = DbMemoryFactRow & {
	domiaName: string | null
	domiaAvatarId: string | null
	evidenceCount: number
}

export type FactWithEvidence = DbMemoryFactRow & {
	evidenceCount: number
}

export type FactBadgesProps = {
	fact: DbMemoryFactRow
}

export type MemoryEpisodeRow = DbMemoryEpisodeRow & {
	domiaName: string | null
	domiaAvatarId: string | null
	turnCount: number
	sessionTraceId: string | null
}

export type UserModelView = DbUserModelRow & {
	domiaName: string | null
	domiaAvatarId: string | null
	factCount: number
	episodeCount: number
}

export type MemoryCounts = {
	facts: number
	episodes: number
	userModels: number
}

export type FactEvidenceLink = {
	id: string
	interactionId: string
	createdAt: string
	input: string | null
	mirrored: boolean
}

export type FactEvidenceProps = {
	factId: string
	count: number
}

export type EpisodeCardProps = {
	row: MemoryEpisodeRow
}

export type MemoriesTab = "facts" | "episodes" | "user-model"

export type MemoryTableShellProps<TRow extends { id: string }> = {
	viewKey: string
	queryKey: string
	fetcher: (params: TableParams) => Promise<Paginated<TRow>>
	domiaOptionsQueryKey: string
	domiaOptionsFn: () => Promise<FilterFacetOption[]>
	columns: ColumnDef<TRow, unknown>[]
	renderCard: (row: TRow) => ReactNode
	cardSkeletonClassName: string
	searchPlaceholder: string
	loadFailedLabel: string
	emptyLabel: string
	emptyHint: string
}
