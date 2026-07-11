import { useEffect, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
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
import {
	allSatellitesQueryOptions,
	testSatelliteSpeakerFn,
	setSatelliteFollowUpFn,
	setSatelliteVolumeFn,
} from "@/server/satellites"
import { domiaTargetsQueryOptions } from "@/server/fleet"
import { AddSatelliteDialog } from "./add-satellite-dialog"
import { MetricCard } from "./satellite-bits"
import { SatellitesTable } from "./satellites-table"
import { SatelliteDetail } from "./satellite-detail"
import type { SatelliteWithContext } from "@/types/satellites"

export function SatellitesView() {
	const query = useQuery(allSatellitesQueryOptions())
	const targets = useQuery(domiaTargetsQueryOptions())
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

	const sats = query.data?.ok ? (query.data.data ?? []) : []
	const hostedTargets =
		targets.data
			?.filter((t) => t.isHosted)
			.map((t) => ({ domiaKey: t.domiaKey, name: t.name })) ?? []
	const errored = query.isError || query.data?.ok === false
	const loading = query.isLoading && sats.length === 0
	const selected = sats.find((s) => s.id === selectedId) ?? null

	const refresh = () =>
		void qc.invalidateQueries({ queryKey: ["satellites-all"] })

	const select = (s: SatelliteWithContext) => {
		setSelectedId(s.id)
		if (isMobile) setMobileOpen(true)
	}

	const testSpeaker = async (s: SatelliteWithContext) => {
		const res = await testSatelliteSpeakerFn({
			data: { domiaKey: s.domiaKey, satelliteId: s.satelliteId },
		})
		if (res.ok)
			toast.success(m.toast_test_sent({ name: s.name ?? s.satelliteId }))
		else toast.error(errText(res.error))
	}

	const announce = (s: SatelliteWithContext) =>
		navigate({ to: "/broadcast", search: { domia: s.domiaKey } })

	const toggleFollowUp = async (s: SatelliteWithContext, on: boolean) => {
		const res = await setSatelliteFollowUpFn({
			data: { domiaKey: s.domiaKey, satelliteId: s.satelliteId, enabled: on },
		})
		if (res.ok) {
			toast.success(
				on ? m.toast_follow_up_enabled() : m.toast_follow_up_disabled(),
			)
			refresh()
		} else toast.error(errText(res.error))
	}

	const setVolume = async (s: SatelliteWithContext, volume: number) => {
		const res = await setSatelliteVolumeFn({
			data: { domiaKey: s.domiaKey, satelliteId: s.satelliteId, volume },
		})
		if (res.ok) {
			toast.success(m.toast_volume_set({ pct: Math.round(volume * 100) }))
			refresh()
		} else toast.error(errText(res.error))
	}

	const stats = {
		connected: sats.filter((s) => s.online).length,
		offline: sats.filter((s) => !s.online).length,
		esphome: sats.filter((s) => s.protocol === "esphome").length,
		native: sats.filter((s) => s.protocol !== "esphome").length,
		announce: sats.filter((s) => s.capabilities.canAnnounce).length,
		intercom: sats.filter((s) => s.capabilities.canIntercom).length,
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader
				title={m.sat_title()}
				description={m.sat_view_desc()}
				actions={
					<div className="flex items-center gap-2">
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
				<MetricCard icon={Cpu} label="ESPHome" value={stats.esphome} />
				<MetricCard
					icon={Server}
					label={m.sat_metric_native()}
					value={stats.native}
				/>
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

			{errored ? (
				<p className="text-destructive py-16 text-center text-sm">
					{m.sat_load_failed()}
				</p>
			) : loading ? (
				<p className="text-muted-foreground py-16 text-center text-sm">
					{m.sat_view_loading()}
				</p>
			) : sats.length === 0 ? (
				<div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center text-sm">
					<RadioTower className="size-8 opacity-40" />
					<p>{m.sat_empty()}</p>
					<p className="text-xs">{m.sat_empty_hint()}</p>
				</div>
			) : (
				<div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
					<SatellitesTable
						satellites={sats}
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
}
