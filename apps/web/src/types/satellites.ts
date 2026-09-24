import type { LucideIcon } from "lucide-react"
import type {
	SatelliteNumberEntity,
	SatelliteCapabilities,
	SatelliteEvent,
	SatelliteProtocol,
} from "@/types/rooms"
import type { ConfigApplyResult } from "@/types/config"

export type { SatelliteNumberEntity }

export type DiscoveredSatellite = {
	satelliteId: string
	name: string
	host: string
	port: number
}

export type LivekitTokenGrant = {
	url: string
	roomName: string
	token: string
}

export type DiscoverSatellitesResult = {
	satellites: DiscoveredSatellite[]
}

export type ListSatellitesResult = {
	satellites: BoundSatelliteRow[]
}

export type LivekitLabStatus = "idle" | "connecting" | "connected" | "error"

export type LivekitLabLogEntry = {
	at: number
	kind: "transcript" | "error" | "info"
	text: string
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
	followUpNoSpeechMs: number
	followUpRequestMaxMs: number
	playbackDrainMarginMs: number
	runListeningMaxMs: number
	captureHeadTrimMs: number
	wyomingStreamingTts: boolean
	mediaPlayerName: string | null
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
	volume: number | null
	capabilities: SatelliteCapabilities
	firmwareVersion: string | null
	recentEvents: SatelliteEvent[]
}

export type SatelliteWithContext = BoundSatellite & {
	domiaKey: string
	domiaName: string
	avatarId: string | null
}

export type SatelliteFleetStats = {
	connected: number
	offline: number
	byProtocol: Record<SatelliteProtocol, number>
	announce: number
	intercom: number
}

export type SatelliteFleet = {
	satellites: SatelliteWithContext[]
	stats: SatelliteFleetStats
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

export type SetVolumeResult = {
	applied: boolean
	live: boolean
}

export type SatelliteSettings = {
	followUpNoSpeechMs: number
	followUpRequestMaxMs: number
	playbackDrainMarginMs: number
	runListeningMaxMs: number
	captureHeadTrimMs: number
	wyomingStreamingTts: boolean
	mediaPlayerName: string | null
}

export type SatelliteSettingsInput = Partial<SatelliteSettings>

export type SetSatelliteSettingsResult = {
	applied: boolean
	settings: SatelliteSettingsInput
	apply: ConfigApplyResult
}

export type SetSatelliteSettingsInput = {
	domiaKey: string
	satelliteId: string
	settings: SatelliteSettingsInput
}

export type SatelliteSettingsNumberField =
	| "followUpNoSpeechMs"
	| "followUpRequestMaxMs"
	| "playbackDrainMarginMs"
	| "runListeningMaxMs"
	| "captureHeadTrimMs"

export type SatelliteSettingsNumberMeta = {
	field: SatelliteSettingsNumberField
	label: () => string
	hint: () => string
}

export type SatelliteSettingsDraft = {
	numbers: Record<SatelliteSettingsNumberField, string>
	wyomingStreamingTts: boolean
	mediaPlayerName: string
}

export type SatelliteSettingsProps = {
	satellite: SatelliteWithContext
}

export type SatelliteTimersProps = {
	satellite: SatelliteWithContext
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
	protocol?: string
	livekitRoom?: string
	livekitApiKey?: string
	livekitApiSecret?: string
}

export type SatelliteTargetOption = {
	domiaKey: string
	name: string
}

export type AddSatelliteDialogProps = {
	hosted: SatelliteTargetOption[]
	onCreated?: (targetKey: string) => void | Promise<void>
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
	onSetVolume: (s: SatelliteWithContext, volume: number) => void
}

export type SectionLabelProps = {
	children: string
}

export type InfoRowProps = {
	icon: LucideIcon
	label: string
	value: string
}

export type BindSatelliteVars = {
	body: BindSatelliteBody
	form: { reset: () => void }
}
