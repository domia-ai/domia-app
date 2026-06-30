import {
	Mic,
	Volume2,
	Radio,
	Megaphone,
	PhoneCall,
	CornerDownRight,
	AudioLines,
	Play,
	RefreshCw,
	AlertTriangle,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import type {
	BoundSatellite,
	StatusIndicatorProps,
	ProtocolBadgeProps,
	CapabilityChipsProps,
	MetricCardProps,
} from "@/types/satellites"

const TONE_DOT: Record<string, string> = {
	success: "bg-[var(--success)]",
	warning: "bg-[var(--warning)]",
	danger: "bg-destructive",
	muted: "bg-muted-foreground",
}
const TONE_TEXT: Record<string, string> = {
	success: "text-[var(--success)]",
	warning: "text-[var(--warning)]",
	danger: "text-destructive",
	muted: "text-muted-foreground",
}

const STATUS_META: Record<
	string,
	{ label: string; tone: string; pulse?: boolean }
> = {
	connected: { label: "Connected", tone: "success" },
	listening: { label: "Listening", tone: "success", pulse: true },
	speaking: { label: "Speaking", tone: "success", pulse: true },
	connecting: { label: "Connecting", tone: "warning", pulse: true },
	offline: { label: "Offline", tone: "muted" },
	error: { label: "Error", tone: "danger" },
}

const SPEAKING_WINDOW_MS = 3000

export const satelliteStatus = (s: BoundSatellite): string => {
	if (s.connecting) return "connecting"
	if (!s.online) return s.lastError ? "error" : "offline"
	if (s.micActive) return "listening"
	if (s.lastPlaybackAt && Date.now() - s.lastPlaybackAt < SPEAKING_WINDOW_MS)
		return "speaking"
	return "connected"
}

export const satelliteLastSeen = (s: BoundSatellite): number =>
	Math.max(
		s.connectedAt ?? 0,
		s.lastTurnAt ?? 0,
		s.lastPlaybackAt ?? 0,
		s.lastActiveAt ?? 0,
	)

export const satelliteCaps = (s: BoundSatellite): Record<string, boolean> => ({
	mic: s.capabilities.canHear,
	speaker: s.capabilities.canSpeak,
	wake: (s.availableWakeWords?.length ?? 0) > 0,
	announce: s.capabilities.canAnnounce,
	intercom: s.capabilities.canIntercom,
	followup: s.capabilities.canFollowUp,
})

export function StatusIndicator({ status, className }: StatusIndicatorProps) {
	const meta = STATUS_META[status] ?? STATUS_META.offline
	return (
		<span className={cn("inline-flex items-center gap-1.5", className)}>
			<span className="relative flex size-2">
				{meta.pulse && (
					<span
						className={cn(
							"absolute inline-flex size-full animate-ping rounded-full opacity-60",
							TONE_DOT[meta.tone],
						)}
					/>
				)}
				<span
					className={cn(
						"relative inline-flex size-2 rounded-full",
						TONE_DOT[meta.tone],
					)}
				/>
			</span>
			<span className={cn("text-xs font-medium", TONE_TEXT[meta.tone])}>
				{meta.label}
			</span>
		</span>
	)
}

const PROTOCOL_META: Record<string, { label: string; cls: string }> = {
	native: {
		label: "Native",
		cls: "border-[var(--chart-1)]/40 text-[var(--chart-1)]",
	},
	wyoming: {
		label: "Wyoming",
		cls: "border-[var(--chart-3)]/40 text-[var(--chart-3)]",
	},
	esphome: {
		label: "ESPHome",
		cls: "border-[var(--chart-4)]/40 text-[var(--chart-4)]",
	},
}

export function ProtocolBadge({ protocol }: ProtocolBadgeProps) {
	const meta = PROTOCOL_META[protocol] ?? {
		label: protocol,
		cls: "border-border text-muted-foreground",
	}
	return (
		<Badge
			variant="outline"
			className={cn("text-[10px] tracking-wide uppercase", meta.cls)}
		>
			{meta.label}
		</Badge>
	)
}

const CAP_ORDER = [
	"mic",
	"speaker",
	"wake",
	"announce",
	"intercom",
	"followup",
] as const
const CAP_ICON: Record<string, LucideIcon> = {
	mic: Mic,
	speaker: Volume2,
	wake: Radio,
	announce: Megaphone,
	intercom: PhoneCall,
	followup: CornerDownRight,
}
const CAP_LABEL: Record<string, string> = {
	mic: "Microphone",
	speaker: "Speaker",
	wake: "Wake word",
	announce: "Announce",
	intercom: "Intercom",
	followup: "Follow-up",
}

export function CapabilityChips({ caps, className }: CapabilityChipsProps) {
	return (
		<div className={cn("flex items-center gap-1", className)}>
			{CAP_ORDER.map((cap) => {
				const Icon = CAP_ICON[cap]
				const on = caps[cap]
				return (
					<Tooltip key={cap}>
						<TooltipTrigger
							render={
								<span
									className={cn(
										"flex size-6 items-center justify-center rounded-md border",
										on
											? "border-border bg-muted/40 text-foreground"
											: "text-muted-foreground/35 border-transparent",
									)}
								/>
							}
						>
							<Icon className="size-3.5" />
						</TooltipTrigger>
						<TooltipContent>
							{CAP_LABEL[cap]}: {on ? "enabled" : "unavailable"}
						</TooltipContent>
					</Tooltip>
				)
			})}
		</div>
	)
}

export const EVENT_ICON: Record<string, LucideIcon> = {
	wake: Radio,
	audio: AudioLines,
	playback: Play,
	announce: Megaphone,
	reconnect: RefreshCw,
	error: AlertTriangle,
}

export function MetricCard({
	icon: Icon,
	label,
	value,
	tone = "muted",
}: MetricCardProps) {
	const toneClass =
		tone === "success"
			? "text-[var(--success)] bg-[var(--success)]/10"
			: tone === "danger"
				? "text-destructive bg-destructive/10"
				: tone === "primary"
					? "text-primary bg-primary/10"
					: "text-muted-foreground bg-muted"
	return (
		<Card className="flex flex-row items-center gap-3 p-3">
			<span
				className={cn(
					"flex size-9 shrink-0 items-center justify-center rounded-md",
					toneClass,
				)}
			>
				<Icon className="size-4" />
			</span>
			<div className="min-w-0 leading-tight">
				<p className="text-xl font-semibold tabular-nums">{value}</p>
				<p className="text-muted-foreground text-xs leading-tight text-pretty">
					{label}
				</p>
			</div>
		</Card>
	)
}
