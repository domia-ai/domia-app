import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import {
	Wifi,
	WifiOff,
	Cpu,
	Server,
	Megaphone,
	PhoneCall,
	RefreshCw,
	RadioTower,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { PageHeader } from "@/components/shell/page-header"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import {
	allSatellitesQueryOptions,
	testSatelliteSpeakerFn,
	setSatelliteFollowUpFn,
	setSatelliteVolumeFn,
} from "@/server/satellites"
import { domiaTargetsQueryOptions } from "@/server/fleet"
import { useActionQuery, useDataQuery } from "@/hooks/use-query-state"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { AddSatelliteDialog } from "./add-satellite-dialog"
import { MetricCard } from "./satellite-bits"
import { SatellitesTable } from "./satellites-table"
import { SatelliteDetail } from "./satellite-detail"
import type { SatelliteProtocol } from "@/types/rooms"
import type { SatelliteWithContext } from "@/types/satellites"

const PROTOCOL_LABELS: Record<SatelliteProtocol, () => string> = {
	native: m.sat_metric_native,
	wyoming: () => "Wyoming",
	esphome: () => "ESPHome",
	livekit: () => "LiveKit",
	"openai-realtime": () => "OpenAI Realtime",
}

const protocolsOf = (
	byProtocol: Record<SatelliteProtocol, number>,
): SatelliteProtocol[] =>
	(Object.keys(PROTOCOL_LABELS) as SatelliteProtocol[]).filter(
		(protocol) => byProtocol[protocol] > 0,
	)

export function SatellitesView() {
	const { state } = useActionQuery({
		...allSatellitesQueryOptions(),
		errorMessage: m.sat_load_failed,
	})
	const { state: targetsState } = useDataQuery({
		...domiaTargetsQueryOptions(),
		errorMessage: m.sat_targets_error,
	})
	const qc = useQueryClient()
	const navigate = useNavigate()
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [mobileOpen, setMobileOpen] = useState(false)
	const [isMobile, setIsMobile] = useState(false)

	useEffect(() => {
		const mq = window.matchMedia("(max-width: 1023px)")
		const update = () => setIsMobile(mq.matches)
		update()
		mq.addEventListener("change", update)
		return () => mq.removeEventListener("change", update)
	}, [])

	const hostedTargets =
		targetsState.status === "ready"
			? targetsState.data
					.filter((t) => t.isHosted)
					.map((t) => ({ domiaKey: t.domiaKey, name: t.name }))
			: []

	const refresh = () =>
		void qc.invalidateQueries({ queryKey: ["satellites-all"] })

	const select = (s: SatelliteWithContext) => {
		setSelectedId(s.id)
		if (isMobile) setMobileOpen(true)
	}

	const testSpeakerMutation = useActionMutation({
		mutationFn: (s: SatelliteWithContext) =>
			testSatelliteSpeakerFn({
				data: { domiaKey: s.domiaKey, satelliteId: s.satelliteId },
			}),
		failureTitle: m.toast_test_play_failed,
		onDone: (_data, s) =>
			toast.success(m.toast_test_sent({ name: s.name ?? s.satelliteId })),
	})

	const followUpMutation = useActionMutation({
		mutationFn: (vars: { satellite: SatelliteWithContext; enabled: boolean }) =>
			setSatelliteFollowUpFn({
				data: {
					domiaKey: vars.satellite.domiaKey,
					satelliteId: vars.satellite.satelliteId,
					enabled: vars.enabled,
				},
			}),
		failureTitle: m.toast_follow_up_change_failed,
		onDone: (_data, vars) => {
			toast.success(
				vars.enabled
					? m.toast_follow_up_enabled()
					: m.toast_follow_up_disabled(),
			)
			refresh()
		},
	})

	const volumeMutation = useActionMutation({
		mutationFn: (vars: { satellite: SatelliteWithContext; volume: number }) =>
			setSatelliteVolumeFn({
				data: {
					domiaKey: vars.satellite.domiaKey,
					satelliteId: vars.satellite.satelliteId,
					volume: vars.volume,
				},
			}),
		failureTitle: m.err_set_volume,
		onDone: (_data, vars) => {
			toast.success(m.toast_volume_set({ pct: Math.round(vars.volume * 100) }))
			refresh()
		},
	})

	const testSpeaker = (s: SatelliteWithContext) => testSpeakerMutation.mutate(s)

	const announce = (s: SatelliteWithContext) =>
		navigate({ to: "/broadcast", search: { domia: s.domiaKey } })

	const toggleFollowUp = (s: SatelliteWithContext, on: boolean) =>
		followUpMutation.mutate({ satellite: s, enabled: on })

	const setVolume = (s: SatelliteWithContext, volume: number) =>
		volumeMutation.mutate({ satellite: s, volume })

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={m.sat_title()}
				description={m.sat_view_desc()}
				actions={
					<div className="flex items-center gap-2">
						{targetsState.status === "error" ? (
							<p className="text-destructive text-xs">{targetsState.message}</p>
						) : null}
						<AddSatelliteDialog
							hosted={hostedTargets}
							onCreated={() =>
								qc.invalidateQueries({ queryKey: ["satellites-all"] })
							}
						/>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={m.aria_refresh()}
							onClick={refresh}
						>
							<RefreshCw className="size-4" />
						</Button>
					</div>
				}
			/>

			<AsyncBoundary
				state={state}
				skeleton={
					<p className="text-muted-foreground py-16 text-center text-sm">
						{m.sat_view_loading()}
					</p>
				}
			>
				{(fleet) => {
					if (!fleet) return null
					const { satellites, stats } = fleet
					const selected = satellites.find((s) => s.id === selectedId) ?? null
					return (
						<div className="flex flex-col gap-6">
							<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
								<MetricCard
									icon={Wifi}
									label={m.sat_metric_connected()}
									value={stats.connected}
									tone="success"
								/>
								<MetricCard
									icon={WifiOff}
									label={m.sat_metric_offline()}
									value={stats.offline}
									tone="danger"
								/>
								{protocolsOf(stats.byProtocol).map((protocol) => (
									<MetricCard
										key={protocol}
										icon={protocol === "esphome" ? Cpu : Server}
										label={PROTOCOL_LABELS[protocol]()}
										value={stats.byProtocol[protocol]}
									/>
								))}
								<MetricCard
									icon={Megaphone}
									label={m.sat_metric_announce()}
									value={stats.announce}
								/>
								<MetricCard
									icon={PhoneCall}
									label={m.sat_metric_intercom()}
									value={stats.intercom}
								/>
							</div>

							{satellites.length === 0 ? (
								<div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center text-sm">
									<RadioTower className="size-8 opacity-40" />
									<p>{m.sat_empty()}</p>
									<p className="text-xs">{m.sat_empty_hint()}</p>
								</div>
							) : (
								<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
									<SatellitesTable
										satellites={satellites}
										selectedId={isMobile ? null : selectedId}
										onSelect={select}
										onTestSpeaker={testSpeaker}
										onAnnounce={announce}
									/>
									<aside className="hidden lg:block">
										<div className="sticky top-6">
											<Card className="p-5">
												{selected ? (
													<SatelliteDetail
														key={selected.id}
														satellite={selected}
														onTestSpeaker={testSpeaker}
														onAnnounce={announce}
														onSetVolume={setVolume}
														onToggleFollowUp={toggleFollowUp}
													/>
												) : (
													<div className="text-muted-foreground flex flex-col items-center gap-2 py-12 text-center text-sm">
														<RadioTower className="size-7 opacity-40" />
														<p>{m.sat_select_prompt()}</p>
													</div>
												)}
											</Card>
										</div>
									</aside>
								</div>
							)}

							<Dialog
								open={isMobile && mobileOpen}
								onOpenChange={(o) => setMobileOpen(o)}
							>
								<DialogContent className="max-h-[88vh] overflow-y-auto">
									<DialogHeader className="sr-only">
										<DialogTitle>
											{m.sat_details_title({
												name: selected?.name ?? m.sat_col_satellite(),
											})}
										</DialogTitle>
									</DialogHeader>
									{selected ? (
										<SatelliteDetail
											key={selected.id}
											satellite={selected}
											onTestSpeaker={testSpeaker}
											onAnnounce={announce}
											onSetVolume={setVolume}
											onToggleFollowUp={toggleFollowUp}
										/>
									) : null}
								</DialogContent>
							</Dialog>
						</div>
					)
				}}
			</AsyncBoundary>
		</div>
	)
}
