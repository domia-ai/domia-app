import { Link } from "@tanstack/react-router"
import {
	Wifi,
	Server,
	Radio,
	Cpu,
	Clock,
	Volume2,
	Megaphone,
	AlertTriangle,
	ArrowRight,
	RotateCw,
} from "lucide-react"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { cn } from "@/lib/utils"
import { relativeTimeMs } from "@/utils/format"
import {
	StatusIndicator,
	ProtocolBadge,
	EVENT_ICON,
	satelliteStatus,
	satelliteLastSeen,
	satelliteCaps,
} from "./satellite-bits"
import type {
	SectionLabelProps,
	InfoRowProps,
	SatelliteDetailProps,
} from "@/types/satellites"

function SectionLabel({ children }: SectionLabelProps) {
	return (
		<p className="text-muted-foreground mb-1.5 text-[11px] font-medium tracking-wide uppercase">
			{children}
		</p>
	)
}

function VolumeControl({
	volume,
	disabled,
	onCommit,
}: {
	volume: number
	disabled: boolean
	onCommit: (v: number) => void
}) {
	return (
		<div className="border-border flex flex-col gap-2 rounded-md border px-3 py-2">
			<div className="flex items-center justify-between">
				<span className="flex items-center gap-1.5 text-sm font-medium">
					<Volume2 className="size-4" /> {m.sat_speaker_volume()}
				</span>
				<span className="text-muted-foreground text-sm tabular-nums">
					{Math.round(volume * 100)}%
				</span>
			</div>
			<Slider
				key={volume}
				defaultValue={[volume]}
				min={0}
				max={1}
				step={0.05}
				disabled={disabled}
				onValueCommitted={(v: number | readonly number[]) =>
					onCommit(Array.isArray(v) ? v[0] : (v as number))
				}
			/>
		</div>
	)
}

function InfoRow({ icon: Icon, label, value }: InfoRowProps) {
	return (
		<div className="flex items-center justify-between gap-3 py-1.5 text-sm">
			<span className="text-muted-foreground flex items-center gap-2">
				<Icon className="size-3.5" />
				{label}
			</span>
			<span className="truncate font-mono text-xs">{value}</span>
		</div>
	)
}

const CAP_ROWS: { key: string; label: () => string }[] = [
	{ key: "mic", label: m.sat_cap_mic },
	{ key: "speaker", label: m.sat_cap_speaker },
	{ key: "wake", label: m.sat_cap_wake },
	{ key: "announce", label: m.sat_cap_announce },
	{ key: "intercom", label: m.sat_cap_intercom },
	{ key: "followup", label: m.sat_cap_follow_up },
]

export function SatelliteDetail({
	satellite: s,
	onTestSpeaker,
	onAnnounce,
	onToggleFollowUp,
	onSetVolume,
}: SatelliteDetailProps) {
	const status = satelliteStatus(s)
	const caps = satelliteCaps(s)
	const lastSeen = satelliteLastSeen(s)

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-col gap-3">
				<div className="flex items-start justify-between gap-3">
					<div className="min-w-0">
						<h2 className="text-lg leading-tight font-semibold text-balance">
							{s.name ?? s.satelliteId}
						</h2>
						<p className="text-muted-foreground text-sm">{s.domiaName}</p>
					</div>
					<ProtocolBadge protocol={s.protocol} />
				</div>
				<div className="flex items-center justify-between">
					<StatusIndicator status={status} />
					{status === "error" && s.lastError ? (
						<span className="text-destructive flex items-center gap-1 text-xs">
							<AlertTriangle className="size-3.5 shrink-0" />
							<span className="truncate">{s.lastError}</span>
						</span>
					) : null}
				</div>
			</div>

			<div className="border-border bg-muted/30 flex items-center gap-3 rounded-lg border p-3">
				<PersonaAvatar
					domiaKey={s.domiaKey}
					name={s.domiaName}
					avatarId={s.avatarId}
					size="md"
				/>
				<div className="min-w-0 flex-1">
					<p className="text-muted-foreground text-[11px] tracking-wide uppercase">
						{m.sat_assigned_domia()}
					</p>
					<p className="truncate text-sm font-medium">{s.domiaName}</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					render={<Link to="/domias/$key" params={{ key: s.domiaKey }} />}
				>
					{m.sat_configure()} <ArrowRight className="size-3.5" />
				</Button>
			</div>

			<div>
				<SectionLabel>{m.sat_section_connection()}</SectionLabel>
				<div className="border-border rounded-lg border px-3">
					<InfoRow
						icon={Wifi}
						label={m.sat_info_address()}
						value={`${s.host}:${s.port}`}
					/>
					<Separator />
					<InfoRow
						icon={Radio}
						label={m.sat_info_protocol()}
						value={s.protocol}
					/>
					<Separator />
					<InfoRow
						icon={Cpu}
						label={m.sat_info_firmware()}
						value={s.firmwareVersion ?? "—"}
					/>
					<Separator />
					<InfoRow
						icon={RotateCw}
						label={m.sat_info_reconnects()}
						value={String(s.reconnectCount)}
					/>
					<Separator />
					<InfoRow
						icon={Server}
						label={m.sat_info_sample_rate()}
						value={s.sampleRate ? `${s.sampleRate} Hz` : "—"}
					/>
					<Separator />
					<InfoRow
						icon={Clock}
						label={m.sat_info_last_seen()}
						value={lastSeen ? relativeTimeMs(lastSeen) : "—"}
					/>
				</div>
			</div>

			<div>
				<SectionLabel>{m.sat_section_capabilities()}</SectionLabel>
				<div className="grid grid-cols-2 gap-1.5">
					{CAP_ROWS.map((c) => {
						const on = caps[c.key]
						return (
							<div
								key={c.key}
								className={cn(
									"flex items-center justify-between rounded-md border px-2.5 py-1.5 text-xs",
									on
										? "border-border text-foreground"
										: "border-border text-muted-foreground/60 border-dashed",
								)}
							>
								{c.label()}
								<span
									className={cn(
										"size-1.5 rounded-full",
										on ? "bg-[var(--success)]" : "bg-muted-foreground/40",
									)}
								/>
							</div>
						)
					})}
				</div>
			</div>

			<div className="flex flex-col gap-2">
				<SectionLabel>{m.sat_section_quick_actions()}</SectionLabel>
				<div className="grid grid-cols-2 gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!caps.speaker || !s.online}
						onClick={() => onTestSpeaker(s)}
					>
						<Volume2 className="size-4" /> {m.sat_test_speaker()}
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={!caps.announce || !s.online}
						onClick={() => onAnnounce(s)}
					>
						<Megaphone className="size-4" /> {m.sat_cap_announce()}
					</Button>
				</div>
				<div className="border-border flex items-center justify-between rounded-md border px-3 py-2">
					<span className="text-sm font-medium">{m.sat_follow_up_mode()}</span>
					<Switch
						checked={s.followUpEnabled}
						disabled={!caps.followup || !s.online}
						onCheckedChange={(on) => onToggleFollowUp(s, on)}
					/>
				</div>
				{s.volume !== null ? (
					<VolumeControl
						volume={s.volume}
						disabled={!s.online}
						onCommit={(v) => onSetVolume(s, v)}
					/>
				) : null}
			</div>

			{s.recentEvents.length > 0 ? (
				<div>
					<SectionLabel>{m.sat_section_recent_events()}</SectionLabel>
					<ul className="flex flex-col gap-2.5">
						{s.recentEvents.map((ev) => {
							const Icon = EVENT_ICON[ev.kind] ?? Radio
							const danger = ev.kind === "error"
							return (
								<li key={ev.id} className="flex items-start gap-2.5">
									<span
										className={cn(
											"mt-0.5 flex size-6 items-center justify-center rounded-full",
											danger
												? "bg-destructive/10 text-destructive"
												: "bg-muted text-muted-foreground",
										)}
									>
										<Icon className="size-3.5" />
									</span>
									<div className="min-w-0 flex-1 leading-tight">
										<p
											className={cn(
												"text-xs",
												danger ? "text-destructive" : "text-foreground",
											)}
										>
											{ev.detail}
										</p>
										<p className="text-muted-foreground text-[11px]">
											{relativeTimeMs(ev.at)}
										</p>
									</div>
								</li>
							)
						})}
					</ul>
				</div>
			) : null}
		</div>
	)
}
