import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import {
	RadarIcon,
	Trash2,
	Volume2,
	SlidersHorizontal,
	ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "@/components/domia/status"
import { relativeTimeMs } from "@/utils/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { buildBindSatelliteFormSchema } from "@/schemas/satellites"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
	Collapsible,
	CollapsibleTrigger,
	CollapsibleContent,
} from "@/components/ui/collapsible"
import {
	discoverSatellitesQueryOptions,
	satellitesQueryOptions,
	bindSatelliteFn,
	unbindSatelliteFn,
	setSatelliteWakeWordsFn,
	setSatelliteNumberFn,
	setSatelliteFollowUpFn,
	testSatelliteSpeakerFn,
} from "@/server/satellites"
import { isDemoMode } from "@/lib/demo"
import { groupSatelliteNumbers } from "@/utils/satellites"
import type {
	DiscoveredSatellite,
	BoundSatellite,
	SatelliteNumberEntity,
} from "@/types/satellites"
import type { NodeIdentitySummary } from "@/types/nodes"

const BIND_CONFIRM_MS = 25000

function NumberSlider({
	entity,
	domiaKey,
	satelliteId,
	disabled,
}: {
	entity: SatelliteNumberEntity
	domiaKey: string
	satelliteId: string
	disabled: boolean
}) {
	const queryClient = useQueryClient()
	const min = entity.min ?? 0
	const max = entity.max ?? 1
	const step = entity.step ?? 0.01
	const [draft, setDraft] = useState<number>(entity.value ?? min)

	useEffect(() => {
		setDraft(entity.value ?? min)
	}, [entity.value, min])

	const mutation = useMutation({
		mutationFn: (value: number) =>
			setSatelliteNumberFn({
				data: { domiaKey, satelliteId, entityId: entity.id, value },
			}),
	})

	const onCommit = async (value: number) => {
		const result = await mutation.mutateAsync(value)
		if (result.ok) {
			toast.success(
				result.data?.live
					? m.toast_entity_applied({ name: entity.name })
					: m.toast_entity_saved_reconnect({ name: entity.name }),
			)
			await queryClient.invalidateQueries({
				queryKey: ["satellites", domiaKey],
			})
		} else {
			toast.error(m.toast_entity_set_failed({ name: entity.name }), {
				description: errText(result.error),
			})
		}
	}

	return (
		<div className="space-y-1">
			<div className="flex items-center justify-between gap-2">
				<span className="text-muted-foreground truncate text-xs">
					{entity.name}
				</span>
				<span className="text-muted-foreground font-mono text-[10px]">
					{entity.value != null
						? `${draft}${entity.unit ? ` ${entity.unit}` : ""}`
						: "—"}
				</span>
			</div>
			<Slider
				value={draft}
				min={min}
				max={max}
				step={step}
				disabled={disabled || mutation.isPending}
				onValueChange={(v) => setDraft(Array.isArray(v) ? (v[0] ?? min) : v)}
				onValueCommitted={(v) =>
					void onCommit(Array.isArray(v) ? (v[0] ?? min) : v)
				}
			/>
		</div>
	)
}

function FollowUpToggle({
	enabled,
	domiaKey,
	satelliteId,
	disabled,
}: {
	enabled: boolean
	domiaKey: string
	satelliteId: string
	disabled: boolean
}) {
	const queryClient = useQueryClient()
	const mutation = useMutation({
		mutationFn: (next: boolean) =>
			setSatelliteFollowUpFn({
				data: { domiaKey, satelliteId, enabled: next },
			}),
	})

	const onToggle = async (next: boolean) => {
		const result = await mutation.mutateAsync(next)
		if (result.ok) {
			toast.success(next ? m.toast_follow_up_on() : m.toast_follow_up_off())
			await queryClient.invalidateQueries({
				queryKey: ["satellites", domiaKey],
			})
		} else {
			toast.error(m.toast_follow_up_change_failed(), {
				description: errText(result.error),
			})
		}
	}

	return (
		<div className="flex items-center justify-between gap-2 pt-1">
			<span className="text-muted-foreground text-xs">
				{m.sat_follow_up_hands_free()}
			</span>
			<Switch
				checked={enabled}
				disabled={disabled || mutation.isPending}
				onCheckedChange={(v) => void onToggle(v)}
			/>
		</div>
	)
}

function SatelliteRow({
	sat,
	domiaKey,
	demo,
	onUnbind,
	unbindPending,
}: {
	sat: BoundSatellite
	domiaKey: string
	demo: boolean
	onUnbind: (satelliteId: string) => void
	unbindPending: boolean
}) {
	const queryClient = useQueryClient()

	const testMutation = useMutation({
		mutationFn: () =>
			testSatelliteSpeakerFn({
				data: { domiaKey, satelliteId: sat.satelliteId },
			}),
	})

	const wakeMutation = useMutation({
		mutationFn: (wakeWords: string[]) =>
			setSatelliteWakeWordsFn({
				data: { domiaKey, satelliteId: sat.satelliteId, wakeWords },
			}),
	})

	const onTest = async () => {
		const result = await testMutation.mutateAsync()
		if (result.ok && result.data?.delivered) {
			toast.success(m.toast_test_playing())
		} else {
			toast.error(m.toast_test_play_failed(), {
				description: result.ok
					? m.toast_test_play_failed_desc({
							target: result.data?.target ?? "none",
						})
					: errText(result.error),
			})
		}
	}

	const onWake = async (wakeWordId: string | null) => {
		if (!wakeWordId) return
		const result = await wakeMutation.mutateAsync([wakeWordId])
		if (result.ok) {
			toast.success(
				result.data?.live
					? m.toast_wake_applied()
					: m.toast_wake_saved_reconnect(),
			)
			await queryClient.invalidateQueries({
				queryKey: ["satellites", domiaKey],
			})
		} else {
			toast.error(m.toast_wake_set_failed(), {
				description: errText(result.error),
			})
		}
	}

	const numberGroups = groupSatelliteNumbers(sat.numberEntities)
	const [tuneOpen, setTuneOpen] = useState(false)

	const diagnostics = [
		sat.sampleRate ? `${Math.round(sat.sampleRate / 1000)}kHz` : null,
		sat.reconnectCount > 0
			? m.sat_diag_reconnects({ count: sat.reconnectCount })
			: null,
		sat.lastTurnAt
			? m.sat_diag_turn({ time: relativeTimeMs(sat.lastTurnAt) })
			: null,
		sat.lastPlaybackAt
			? m.sat_diag_play({ time: relativeTimeMs(sat.lastPlaybackAt) })
			: null,
	].filter(Boolean)

	return (
		<div className="space-y-1 rounded-md border p-2">
			<div className="flex items-center gap-2">
				<StatusDot online={sat.online} />
				{sat.online && sat.micActive ? (
					<span className="relative flex size-2" title={m.sat_hearing_audio()}>
						<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
						<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
					</span>
				) : null}
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="truncate text-sm font-medium">
							{sat.name ?? sat.satelliteId}
						</span>
						<span className="text-muted-foreground font-mono text-xs">
							{sat.host}:{sat.port}
						</span>
					</div>
					{sat.online ? (
						<span className="text-muted-foreground text-xs">
							{`${sat.status ?? "idle"}${sat.connectedAt ? ` · ${m.sat_up_time({ time: relativeTimeMs(sat.connectedAt) })}` : ""}`}
						</span>
					) : sat.connecting ? (
						<span className="text-muted-foreground text-xs">
							{m.sat_connecting()}
						</span>
					) : sat.lastError ? (
						<span className="text-destructive text-xs">
							{m.sat_offline_error({ error: sat.lastError })}
						</span>
					) : (
						<span className="text-muted-foreground text-xs">
							{m.sat_offline()}
						</span>
					)}
				</div>
				<Badge variant="outline">{sat.protocol}</Badge>
				<Button
					variant="ghost"
					size="icon"
					title={m.sat_test_speaker()}
					disabled={demo || !sat.online || testMutation.isPending}
					onClick={onTest}
				>
					<Volume2 className="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					title={m.sat_unbind()}
					disabled={demo || unbindPending}
					onClick={() => onUnbind(sat.satelliteId)}
				>
					<Trash2 className="size-4" />
				</Button>
			</div>

			{sat.online ? (
				<Collapsible open={tuneOpen} onOpenChange={setTuneOpen}>
					<CollapsibleTrigger className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs">
						<SlidersHorizontal className="size-3.5" />
						{m.sat_tune()}
						<ChevronDown
							className={`size-3 transition-transform ${tuneOpen ? "rotate-180" : ""}`}
						/>
					</CollapsibleTrigger>
					<CollapsibleContent className="space-y-3 pt-2">
						{sat.availableWakeWords.length > 0 ? (
							<Select
								value={sat.activeWakeWords[0] ?? ""}
								onValueChange={onWake}
								disabled={demo || wakeMutation.isPending}
							>
								<SelectTrigger size="sm" className="h-7 text-xs">
									<SelectValue placeholder={m.sat_wake_word_placeholder()} />
								</SelectTrigger>
								<SelectContent>
									{sat.availableWakeWords.map((w) => (
										<SelectItem key={w.id} value={w.id}>
											{w.wakeWord}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						) : null}

						{numberGroups.map((group) => (
							<div key={group.label} className="space-y-1.5">
								<span className="text-muted-foreground text-[10px] font-medium uppercase">
									{group.label}
								</span>
								<div className="grid grid-cols-2 gap-x-4 gap-y-2">
									{group.entities.map((entity) => (
										<NumberSlider
											key={entity.id}
											entity={entity}
											domiaKey={domiaKey}
											satelliteId={sat.satelliteId}
											disabled={demo || !sat.online}
										/>
									))}
								</div>
							</div>
						))}

						{sat.protocol === "esphome" ? (
							<FollowUpToggle
								enabled={sat.followUpEnabled}
								domiaKey={domiaKey}
								satelliteId={sat.satelliteId}
								disabled={demo}
							/>
						) : null}

						{diagnostics.length > 0 ? (
							<span className="text-muted-foreground block font-mono text-[10px]">
								{diagnostics.join(" · ")}
							</span>
						) : null}
					</CollapsibleContent>
				</Collapsible>
			) : null}
		</div>
	)
}

function BoundSatellites({
	domiaKey,
	name,
	nodeId,
	confirming,
	onConfirmResolved,
}: {
	domiaKey: string
	name: string
	nodeId: string
	confirming: string | null
	onConfirmResolved: () => void
}) {
	const demo = isDemoMode()
	const queryClient = useQueryClient()
	const { data, isLoading, isError } = useQuery(
		satellitesQueryOptions(domiaKey),
	)
	const sats = data && data.ok ? (data.data ?? []) : []

	const deadlineRef = useRef<number | null>(null)
	useEffect(() => {
		if (!confirming) {
			deadlineRef.current = null
			return
		}
		if (deadlineRef.current === null) {
			deadlineRef.current = Date.now() + BIND_CONFIRM_MS
		}
		const target = sats.find((s) => s.satelliteId === confirming)
		if (target?.online) {
			toast.success(m.toast_device_connected(), {
				description: m.toast_device_connected_desc({
					device: target.name ?? target.satelliteId,
					room: name,
				}),
			})
			onConfirmResolved()
		} else if (Date.now() > deadlineRef.current) {
			toast.warning(m.toast_device_not_responding(), {
				description: m.toast_device_not_responding_desc(),
			})
			onConfirmResolved()
		}
	}, [confirming, sats, name, onConfirmResolved])

	const mutation = useMutation({
		mutationFn: (satelliteId: string) =>
			unbindSatelliteFn({ data: { domiaKey, satelliteId } }),
	})

	const onUnbind = async (satelliteId: string) => {
		const result = await mutation.mutateAsync(satelliteId)
		if (result.ok) {
			toast.success(m.toast_satellite_unbound(), {
				description: m.toast_satellite_unbound_desc(),
			})
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["satellites", domiaKey] }),
				queryClient.invalidateQueries({ queryKey: ["node", nodeId] }),
			])
		} else {
			toast.error(m.toast_unbind_failed(), {
				description: errText(result.error),
			})
		}
	}

	if (isLoading)
		return <p className="text-muted-foreground text-xs">{m.sat_loading()}</p>
	if (isError || !data || !data.ok)
		return (
			<p className="text-destructive text-xs">
				{data && !data.ok ? errText(data.error) : m.sat_load_failed()}
			</p>
		)
	if (sats.length === 0)
		return (
			<p className="text-muted-foreground text-xs">
				{m.sat_none_bound_to({ name })}
			</p>
		)

	return (
		<div className="space-y-2">
			{sats.map((sat) => (
				<SatelliteRow
					key={sat.id}
					sat={sat}
					domiaKey={domiaKey}
					demo={demo}
					onUnbind={onUnbind}
					unbindPending={mutation.isPending}
				/>
			))}
		</div>
	)
}

function BindDialog({
	device,
	hosted,
	nodeId,
	open,
	onOpenChange,
	onBound,
}: {
	device: DiscoveredSatellite
	hosted: NodeIdentitySummary[]
	nodeId: string
	open: boolean
	onOpenChange: (open: boolean) => void
	onBound: (domiaKey: string, satelliteId: string) => void
}) {
	const queryClient = useQueryClient()

	const form = useForm({
		defaultValues: {
			targetKey: hosted[0]?.domiaKey ?? "",
			encryptionKey: "",
		},
		validators: { onChange: buildBindSatelliteFormSchema() },
		onSubmit: async ({ value }) => {
			const result = await bindSatelliteFn({
				data: {
					domiaKey: value.targetKey,
					satelliteId: device.satelliteId,
					name: device.name,
					host: device.host,
					port: device.port,
					encryptionKey: value.encryptionKey.trim() || undefined,
				},
			})
			if (result.ok) {
				toast.success(m.toast_satellite_bound(), {
					description: m.toast_satellite_bound_desc(),
				})
				onOpenChange(false)
				onBound(value.targetKey, device.satelliteId)
				await Promise.all([
					queryClient.invalidateQueries({
						queryKey: ["satellites", value.targetKey],
					}),
					queryClient.invalidateQueries({ queryKey: ["node", nodeId] }),
				])
			} else {
				toast.error(m.toast_bind_failed(), {
					description: errText(result.error),
				})
			}
		},
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.dlg_bind_title({ name: device.name })}</DialogTitle>
					<DialogDescription>{m.dlg_bind_desc()}</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						void form.handleSubmit()
					}}
				>
					<div className="space-y-4">
						<form.Field name="targetKey">
							{(field) => (
								<Field>
									<FieldLabel htmlFor="bind-room">
										{m.dlg_bind_room_label()}
									</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={(v) => v && field.handleChange(v)}
									>
										<SelectTrigger id="bind-room" className="w-full">
											<SelectValue
												placeholder={m.dlg_bind_room_placeholder()}
											/>
										</SelectTrigger>
										<SelectContent>
											{hosted.map((i) => (
												<SelectItem key={i.domiaKey} value={i.domiaKey}>
													{i.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</Field>
							)}
						</form.Field>
						<form.Field name="encryptionKey">
							{(field) => (
								<Field>
									<FieldLabel htmlFor="bind-key">
										{m.dlg_bind_key_label()}
									</FieldLabel>
									<Input
										id="bind-key"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder={m.dlg_bind_key_placeholder()}
									/>
								</Field>
							)}
						</form.Field>
					</div>
					<DialogFooter className="mt-4">
						<DialogClose
							render={
								<Button type="button" variant="outline">
									{m.dlg_cancel()}
								</Button>
							}
						/>
						<form.Subscribe
							selector={(s) => ({
								canSubmit: s.canSubmit,
								isSubmitting: s.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? m.dlg_binding() : m.dlg_bind_action()}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export function SatellitesPanel({
	anchorDomiaKey,
	nodeId,
	hosted,
}: {
	anchorDomiaKey: string
	nodeId: string
	hosted: NodeIdentitySummary[]
}) {
	const demo = isDemoMode()
	const [bindingDevice, setBindingDevice] =
		useState<DiscoveredSatellite | null>(null)
	const [pending, setPending] = useState<{
		domiaKey: string
		satelliteId: string
	} | null>(null)
	const discovery = useQuery(discoverSatellitesQueryOptions(anchorDomiaKey))

	const found =
		discovery.data && discovery.data.ok ? (discovery.data.data ?? []) : []

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0">
				<CardTitle>{m.sat_title()}</CardTitle>
				<Button
					variant="outline"
					size="sm"
					disabled={demo || discovery.isFetching}
					onClick={() => void discovery.refetch()}
				>
					<RadarIcon className="size-4" />
					{discovery.isFetching ? m.sat_scanning() : m.sat_scan()}
				</Button>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					{discovery.isFetching && (
						<p className="text-muted-foreground text-sm">
							{m.sat_scanning_network()}
						</p>
					)}
					{!discovery.isFetching &&
						(discovery.isError || (discovery.data && !discovery.data.ok)) && (
							<p className="text-destructive text-sm">
								{discovery.data && !discovery.data.ok
									? errText(discovery.data.error)
									: m.sat_discovery_failed()}
							</p>
						)}
					{!discovery.isFetching &&
						discovery.isFetched &&
						found.length === 0 && (
							<p className="text-muted-foreground text-sm">
								{m.sat_none_found()}
							</p>
						)}
					{found.map((device) => (
						<div
							key={device.satelliteId}
							className="flex items-center gap-3 rounded-md border p-3"
						>
							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">{device.name}</p>
								<p className="text-muted-foreground font-mono text-xs">
									{device.host}:{device.port}
								</p>
							</div>
							<Badge variant="outline">esphome</Badge>
							<Button
								size="sm"
								disabled={demo || hosted.length === 0}
								onClick={() => setBindingDevice(device)}
							>
								{m.dlg_bind_action()}
							</Button>
						</div>
					))}
				</div>

				<div className="space-y-3">
					{hosted.map((identity) => (
						<div key={identity.domiaKey} className="space-y-1">
							<p className="text-muted-foreground text-xs font-medium uppercase">
								{identity.name}
							</p>
							<BoundSatellites
								domiaKey={identity.domiaKey}
								name={identity.name}
								nodeId={nodeId}
								confirming={
									pending?.domiaKey === identity.domiaKey
										? pending.satelliteId
										: null
								}
								onConfirmResolved={() => setPending(null)}
							/>
						</div>
					))}
				</div>
			</CardContent>

			{bindingDevice && (
				<BindDialog
					key={bindingDevice.satelliteId}
					device={bindingDevice}
					hosted={hosted}
					nodeId={nodeId}
					open={!!bindingDevice}
					onOpenChange={(o) => !o && setBindingDevice(null)}
					onBound={(domiaKey, satelliteId) =>
						setPending({ domiaKey, satelliteId })
					}
				/>
			)}
		</Card>
	)
}
