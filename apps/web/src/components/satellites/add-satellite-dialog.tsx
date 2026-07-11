import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RadioTower, RadarIcon, Check } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"
import { errText } from "@/utils/service-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	discoverSatellitesQueryOptions,
	bindSatelliteFn,
} from "@/server/satellites"
import {
	buildAddLivekitSatelliteFormSchema,
	buildDiscoverSatelliteFormSchema,
} from "@/schemas/satellites"
import { isDemoMode } from "@/lib/demo"
import type { AddSatelliteDialogProps } from "@/types/satellites"

export function AddSatelliteDialog({
	hosted,
	onCreated,
}: AddSatelliteDialogProps) {
	const [open, setOpen] = useState(false)
	const [targetKey, setTargetKey] = useState(hosted[0]?.domiaKey ?? "")
	const queryClient = useQueryClient()
	const demo = isDemoMode()

	const finish = async () => {
		setOpen(false)
		await queryClient.invalidateQueries({ queryKey: ["satellites", targetKey] })
		await onCreated?.(targetKey)
	}

	const discovery = useQuery({
		...discoverSatellitesQueryOptions(targetKey),
		enabled: open && !!targetKey,
	})
	const found =
		discovery.data && discovery.data.ok ? (discovery.data.data ?? []) : []

	const discoverForm = useForm({
		defaultValues: { deviceId: "", encryptionKey: "" },
		validators: { onChange: buildDiscoverSatelliteFormSchema() },
		onSubmit: async ({ value }) => {
			const device = found.find((d) => d.satelliteId === value.deviceId)
			if (!device) return
			const result = await bindSatelliteFn({
				data: {
					domiaKey: targetKey,
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
				discoverForm.reset()
				await finish()
			} else {
				toast.error(m.toast_bind_failed(), {
					description: errText(result.error),
				})
			}
		},
	})

	const form = useForm({
		defaultValues: {
			satelliteId: "",
			name: "",
			host: "127.0.0.1",
			port: 7880,
			room: "",
			apiKey: "",
			apiSecret: "",
		},
		validators: { onChange: buildAddLivekitSatelliteFormSchema() },
		onSubmit: async ({ value }) => {
			const result = await bindSatelliteFn({
				data: {
					domiaKey: targetKey,
					satelliteId: value.satelliteId.trim(),
					name: value.name.trim() || undefined,
					host: value.host.trim(),
					port: value.port,
					protocol: "livekit",
					livekitRoom: value.room.trim(),
					livekitApiKey: value.apiKey.trim(),
					livekitApiSecret: value.apiSecret.trim(),
				},
			})
			if (result.ok) {
				toast.success(m.toast_satellite_bound(), {
					description: m.toast_satellite_bound_desc(),
				})
				form.reset()
				await finish()
			} else {
				toast.error(m.toast_bind_failed(), {
					description: errText(result.error),
				})
			}
		},
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button
						variant="outline"
						size="sm"
						disabled={demo || hosted.length === 0}
					>
						<RadioTower className="size-4" />
						{m.dlg_add_sat_trigger()}
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.dlg_add_sat_title()}</DialogTitle>
					<DialogDescription>{m.dlg_add_sat_desc()}</DialogDescription>
				</DialogHeader>

				<Field>
					<FieldLabel htmlFor="add-sat-domia">
						{m.dlg_bind_room_label()}
					</FieldLabel>
					<Select value={targetKey} onValueChange={(v) => v && setTargetKey(v)}>
						<SelectTrigger id="add-sat-domia" className="w-full">
							<SelectValue placeholder={m.dlg_bind_room_placeholder()} />
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

				<Tabs defaultValue="discover" className="mt-2 gap-4">
					<TabsList>
						<TabsTrigger value="discover">{m.dlg_tab_discover()}</TabsTrigger>
						<TabsTrigger value="livekit">{m.dlg_tab_livekit()}</TabsTrigger>
					</TabsList>

					<TabsContent value="discover">
						<form
							onSubmit={(e) => {
								e.preventDefault()
								e.stopPropagation()
								void discoverForm.handleSubmit()
							}}
						>
							<div className="space-y-3">
								<div className="flex items-center justify-between gap-2">
									<span className="text-muted-foreground text-xs">
										{discovery.isFetching ? m.sat_scanning() : ""}
									</span>
									<Button
										type="button"
										variant="outline"
										size="sm"
										disabled={demo || !targetKey || discovery.isFetching}
										onClick={() => void discovery.refetch()}
									>
										<RadarIcon className="size-4" />
										{discovery.isFetching ? m.sat_scanning() : m.sat_scan()}
									</Button>
								</div>
								{discovery.isError || (discovery.data && !discovery.data.ok) ? (
									<p className="text-destructive text-sm">
										{discovery.data && !discovery.data.ok
											? errText(discovery.data.error)
											: m.sat_discovery_failed()}
									</p>
								) : found.length === 0 ? (
									<p className="text-muted-foreground text-sm">
										{m.sat_none_found()}
									</p>
								) : (
									<discoverForm.Field name="deviceId">
										{(field) => (
											<div className="space-y-2">
												{found.map((device) => {
													const selected =
														field.state.value === device.satelliteId
													return (
														<button
															type="button"
															key={device.satelliteId}
															onClick={() =>
																field.handleChange(device.satelliteId)
															}
															className={cn(
																"flex w-full items-center gap-3 rounded-md border p-3 text-left transition-colors",
																selected
																	? "border-primary bg-primary/5"
																	: "hover:bg-muted/50",
															)}
														>
															<div className="min-w-0 flex-1">
																<p className="truncate text-sm font-medium">
																	{device.name}
																</p>
																<p className="text-muted-foreground font-mono text-xs">
																	{device.host}:{device.port}
																</p>
															</div>
															{selected ? (
																<Check className="text-primary size-4 shrink-0" />
															) : null}
														</button>
													)
												})}
											</div>
										)}
									</discoverForm.Field>
								)}
								<discoverForm.Field name="encryptionKey">
									{(field) => (
										<Field>
											<FieldLabel htmlFor="add-sat-key">
												{m.dlg_bind_key_label()}
											</FieldLabel>
											<Input
												id="add-sat-key"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder={m.dlg_bind_key_placeholder()}
											/>
										</Field>
									)}
								</discoverForm.Field>
							</div>
							<DialogFooter className="mt-4">
								<DialogClose
									render={
										<Button type="button" variant="outline">
											{m.dlg_cancel()}
										</Button>
									}
								/>
								<discoverForm.Subscribe
									selector={(s) => ({
										canSubmit: s.canSubmit,
										isSubmitting: s.isSubmitting,
									})}
								>
									{({ canSubmit, isSubmitting }) => (
										<Button
											type="submit"
											disabled={demo || !canSubmit || isSubmitting}
										>
											{isSubmitting ? m.dlg_creating() : m.dlg_create()}
										</Button>
									)}
								</discoverForm.Subscribe>
							</DialogFooter>
						</form>
					</TabsContent>

					<TabsContent value="livekit">
						<form
							onSubmit={(e) => {
								e.preventDefault()
								e.stopPropagation()
								void form.handleSubmit()
							}}
						>
							<div className="space-y-4">
								<form.Field name="satelliteId">
									{(field) => (
										<Field>
											<FieldLabel htmlFor="lk-id">
												{m.dlg_lk_id_label()}
											</FieldLabel>
											<Input
												id="lk-id"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder={m.dlg_lk_id_placeholder()}
											/>
										</Field>
									)}
								</form.Field>
								<form.Field name="name">
									{(field) => (
										<Field>
											<FieldLabel htmlFor="lk-name">
												{m.dlg_field_name()}
											</FieldLabel>
											<Input
												id="lk-name"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
											/>
										</Field>
									)}
								</form.Field>
								<div className="grid grid-cols-[1fr_7rem] gap-3">
									<form.Field name="host">
										{(field) => (
											<Field>
												<FieldLabel htmlFor="lk-host">
													{m.dlg_lk_host_label()}
												</FieldLabel>
												<Input
													id="lk-host"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													placeholder={m.dlg_lk_host_placeholder()}
												/>
											</Field>
										)}
									</form.Field>
									<form.Field name="port">
										{(field) => (
											<Field>
												<FieldLabel htmlFor="lk-port">
													{m.dlg_lk_port_label()}
												</FieldLabel>
												<Input
													id="lk-port"
													type="number"
													value={field.state.value}
													onChange={(e) =>
														field.handleChange(Number(e.target.value))
													}
												/>
											</Field>
										)}
									</form.Field>
								</div>
								<form.Field name="room">
									{(field) => (
										<Field>
											<FieldLabel htmlFor="lk-room-name">
												{m.dlg_lk_room_label()}
											</FieldLabel>
											<Input
												id="lk-room-name"
												value={field.state.value}
												onChange={(e) => field.handleChange(e.target.value)}
												placeholder={m.dlg_lk_room_placeholder()}
											/>
										</Field>
									)}
								</form.Field>
								<div className="grid grid-cols-2 gap-3">
									<form.Field name="apiKey">
										{(field) => (
											<Field>
												<FieldLabel htmlFor="lk-key">
													{m.dlg_lk_api_key_label()}
												</FieldLabel>
												<Input
													id="lk-key"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
											</Field>
										)}
									</form.Field>
									<form.Field name="apiSecret">
										{(field) => (
											<Field>
												<FieldLabel htmlFor="lk-secret">
													{m.dlg_lk_api_secret_label()}
												</FieldLabel>
												<Input
													id="lk-secret"
													type="password"
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
												/>
											</Field>
										)}
									</form.Field>
								</div>
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
											{isSubmitting ? m.dlg_creating() : m.dlg_create()}
										</Button>
									)}
								</form.Subscribe>
							</DialogFooter>
						</form>
					</TabsContent>
				</Tabs>
			</DialogContent>
		</Dialog>
	)
}
