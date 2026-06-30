import type { LucideIcon } from "lucide-react"
import type {
	SatelliteNumberEntity,
	SatelliteCapabilities,
	SatelliteEvent,
} from "@/types/rooms"
import type { ConfigApplyResult } from "@/types/config"

export type { SatelliteNumberEntity }

export type DiscoveredSatellite = {
	satelliteId: string
	name: string
	host: string
	port: number
}

export type BoundSatelliteRow = {
	id: string
	satelliteId: string
	name: string | null
	host: string
	port: number
	protocol: string
	isActive: boolean
	followUpEnabled: boolean
}

export type SatelliteWakeWord = {
	id: string
	wakeWord: string
}

export type BoundSatellite = BoundSatelliteRow & {
	online: boolean
	connecting: boolean
	status: string | null
	connectedAt: number | null
	lastActiveAt: number | null
	lastError: string | null
	micActive: boolean
	reconnectCount: number
	sampleRate: number | null
	lastTurnAt: number | null
	lastPlaybackAt: number | null
	availableWakeWords: SatelliteWakeWord[]
	activeWakeWords: string[]
	numberEntities: SatelliteNumberEntity[]
	capabilities: SatelliteCapabilities
	firmwareVersion: string | null
	recentEvents: SatelliteEvent[]
}

export type SatelliteWithContext = BoundSatellite & {
	domiaKey: string
	domiaName: string
	avatarId: string | null
}

export type SetWakeWordsResult = {
	applied: boolean
	live: boolean
}

export type SetNumberResult = {
	applied: boolean
	live: boolean
}

export type SetFollowUpResult = {
	applied: boolean
	live: boolean
}

export type SatelliteNumberGroup = {
	label: string
	entities: SatelliteNumberEntity[]
}

export type TestSpeakerResult = {
	delivered: boolean
	target: string
}

export type BindSatelliteBody = {
	satelliteId: string
	name?: string
	host: string
	port?: number
	encryptionKey?: string
}

export type BindSatelliteResult = {
	bound: boolean
	apply: ConfigApplyResult
}

export type UnbindSatelliteResult = {
	removed: boolean
	apply: ConfigApplyResult
}

export type StatusIndicatorProps = {
	status: string
	className?: string
}

export type ProtocolBadgeProps = {
	protocol: string
}

export type CapabilityChipsProps = {
	caps: Record<string, boolean>
	className?: string
}

export type MetricCardProps = {
	icon: LucideIcon
	label: string
	value: number
	tone?: "success" | "danger" | "primary" | "muted"
}

export type SatellitesTableProps = {
	satellites: SatelliteWithContext[]
	selectedId: string | null
	onSelect: (s: SatelliteWithContext) => void
	onTestSpeaker: (s: SatelliteWithContext) => void
	onAnnounce: (s: SatelliteWithContext) => void
}

export type SatelliteDetailProps = {
	satellite: SatelliteWithContext
	onTestSpeaker: (s: SatelliteWithContext) => void
	onAnnounce: (s: SatelliteWithContext) => void
	onToggleFollowUp: (s: SatelliteWithContext, on: boolean) => void
}

export type SectionLabelProps = {
	children: string
}

export type InfoRowProps = {
	icon: LucideIcon
	label: string
	value: string
}
