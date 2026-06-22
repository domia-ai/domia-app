import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"
import { RadarIcon, Trash2 } from "lucide-react"
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
import {
	discoverSatellitesQueryOptions,
	satellitesQueryOptions,
	bindSatelliteFn,
	unbindSatelliteFn,
} from "@/server/satellites"
import { isDemoMode } from "@/lib/demo"
import type { DiscoveredSatellite } from "@/types/satellites"
import type { NodeIdentitySummary } from "@/types/nodes"

const BIND_CONFIRM_MS = 25000

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
				<div
					key={sat.id}
					className="flex items-center gap-2 rounded-md border p-2"
				>
					<StatusDot online={sat.online} />
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
						disabled={demo || mutation.isPending}
						onClick={() => onUnbind(sat.satelliteId)}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
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
