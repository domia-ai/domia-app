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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "@/components/domia/status"
import { relativeTimeMs } from "@/utils/format"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { bindSatelliteFormSchema } from "@/schemas/satellites"
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
					? `${entity.name} applied`
					: `${entity.name} saved — applies on reconnect`,
			)
			await queryClient.invalidateQueries({
				queryKey: ["satellites", domiaKey],
			})
		} else {
			toast.error(`Could not set ${entity.name}`, {
				description: result.error,
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
			toast.success(next ? "Hands-free follow-up on" : "Follow-up off")
			await queryClient.invalidateQueries({
				queryKey: ["satellites", domiaKey],
			})
		} else {
			toast.error("Could not change follow-up", { description: result.error })
		}
	}

	return (
		<div className="flex items-center justify-between gap-2 pt-1">
			<span className="text-muted-foreground text-xs">
				Hands-free follow-up
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
			toast.success("Playing test on device")
		} else {
			toast.error("Could not play test", {
				description: result.ok
					? `Nothing played (target: ${result.data?.target ?? "none"})`
					: result.error,
			})
		}
	}

	const onWake = async (wakeWordId: string | null) => {
		if (!wakeWordId) return
		const result = await wakeMutation.mutateAsync([wakeWordId])
		if (result.ok) {
			toast.success(
				result.data?.live
					? "Wake word applied"
					: "Wake word saved — applies on reconnect",
			)
			await queryClient.invalidateQueries({
				queryKey: ["satellites", domiaKey],
			})
		} else {
			toast.error("Could not set wake word", { description: result.error })
		}
	}

	const numberGroups = groupSatelliteNumbers(sat.numberEntities)
	const [tuneOpen, setTuneOpen] = useState(false)

	const diagnostics = [
		sat.sampleRate ? `${Math.round(sat.sampleRate / 1000)}kHz` : null,
		sat.reconnectCount > 0 ? `${sat.reconnectCount} reconnects` : null,
		sat.lastTurnAt ? `turn ${relativeTimeMs(sat.lastTurnAt)}` : null,
		sat.lastPlaybackAt ? `play ${relativeTimeMs(sat.lastPlaybackAt)}` : null,
	].filter(Boolean)

	return (
		<div className="space-y-1 rounded-md border p-2">
			<div className="flex items-center gap-2">
				<StatusDot online={sat.online} />
				{sat.online && sat.micActive ? (
					<span className="relative flex size-2" title="hearing audio">
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
							{`${sat.status ?? "idle"}${sat.connectedAt ? ` · up ${relativeTimeMs(sat.connectedAt)}` : ""}`}
						</span>
					) : sat.connecting ? (
						<span className="text-muted-foreground text-xs">connecting…</span>
					) : sat.lastError ? (
						<span className="text-destructive text-xs">
							offline · {sat.lastError}
						</span>
					) : (
						<span className="text-muted-foreground text-xs">offline</span>
					)}
				</div>
				<Badge variant="outline">{sat.protocol}</Badge>
				<Button
					variant="ghost"
					size="icon"
					title="Test speaker"
					disabled={demo || !sat.online || testMutation.isPending}
					onClick={onTest}
				>
					<Volume2 className="size-4" />
				</Button>
				<Button
					variant="ghost"
					size="icon"
					title="Unbind"
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
						Tune
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
									<SelectValue placeholder="Wake word" />
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
			toast.success("Device connected", {
				description: `${target.name ?? target.satelliteId} is online in ${name}.`,
			})
			onConfirmResolved()
		} else if (Date.now() > deadlineRef.current) {
			toast.warning("Device isn't responding", {
				description:
					"Bound, but it didn't connect. Check the encryption key and that the device is on the network.",
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
			toast.success("Satellite unbound", {
				description: "The node restarts to drop the connection.",
			})
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["satellites", domiaKey] }),
				queryClient.invalidateQueries({ queryKey: ["node", nodeId] }),
			])
		} else {
			toast.error("Could not unbind", { description: result.error })
		}
	}

	if (isLoading)
		return <p className="text-muted-foreground text-xs">Loading…</p>
	if (isError || !data || !data.ok)
		return (
			<p className="text-destructive text-xs">
				{data && !data.ok ? data.error : "Could not load satellites."}
			</p>
		)
	if (sats.length === 0)
		return (
			<p className="text-muted-foreground text-xs">
				No device bound to {name}.
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
		validators: { onChange: bindSatelliteFormSchema },
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
				toast.success("Satellite bound", {
					description: "The node restarts — confirming the connection…",
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
				toast.error("Could not bind", { description: result.error })
			}
		},
	})

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Bind {device.name}</DialogTitle>
					<DialogDescription>
						Assign this device to a room. Paste the device&apos;s API encryption
						key (from its ESPHome setup). The node restarts to connect.
					</DialogDescription>
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
									<FieldLabel htmlFor="bind-room">Room</FieldLabel>
									<Select
										value={field.state.value}
										onValueChange={(v) => v && field.handleChange(v)}
									>
										<SelectTrigger id="bind-room" className="w-full">
											<SelectValue placeholder="Pick a room" />
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
									<FieldLabel htmlFor="bind-key">Encryption key</FieldLabel>
									<Input
										id="bind-key"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										placeholder="base64 API key"
									/>
								</Field>
							)}
						</form.Field>
					</div>
					<DialogFooter className="mt-4">
						<DialogClose
							render={
								<Button type="button" variant="outline">
									Cancel
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
									{isSubmitting ? "Binding…" : "Bind"}
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
				<CardTitle>Satellites</CardTitle>
				<Button
					variant="outline"
					size="sm"
					disabled={demo || discovery.isFetching}
					onClick={() => void discovery.refetch()}
				>
					<RadarIcon className="size-4" />
					{discovery.isFetching ? "Scanning…" : "Scan network"}
				</Button>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-2">
					{discovery.isFetching && (
						<p className="text-muted-foreground text-sm">
							Scanning the network…
						</p>
					)}
					{!discovery.isFetching &&
						(discovery.isError || (discovery.data && !discovery.data.ok)) && (
							<p className="text-destructive text-sm">
								{discovery.data && !discovery.data.ok
									? discovery.data.error
									: "Discovery failed."}
							</p>
						)}
					{!discovery.isFetching &&
						discovery.isFetched &&
						found.length === 0 && (
							<p className="text-muted-foreground text-sm">
								No Satellites devices found on the network.
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
								Bind
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
