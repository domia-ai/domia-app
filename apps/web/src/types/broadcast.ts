import type { LucideIcon } from "lucide-react"
import type { DomiaTarget } from "@/types/fleet"

export type AnnounceDelivery = "original" | "domia-voice"

export type RecentBroadcastTarget = {
	domiaKey: string
	name: string
	delivered: boolean
}

export type RecentBroadcast = {
	broadcastId: string
	text: string
	kind: string
	delivery: string
	createdAt: string
	audioId: string | null
	delivered: number
	total: number
	targets: RecentBroadcastTarget[]
}

export type RecentBroadcastsProps = {
	list: RecentBroadcast[]
}

export type BroadcastViewProps = {
	initialTarget?: string
}

export type DeliveryCardProps = {
	active: boolean
	disabled?: boolean
	onClick: () => void
	icon: LucideIcon
	title: string
	desc: string
}

export type AnnounceControlProps = {
	domias: DomiaTarget[]
	onSent: () => void
	initialTarget?: string
}
