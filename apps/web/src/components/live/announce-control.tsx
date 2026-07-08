import { useForm } from "@tanstack/react-form"
import {
	Megaphone,
	Mic,
	Square,
	Volume2,
	Radio,
	X,
	Check,
	Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { RecordingIndicator } from "@/components/audio/recording-indicator"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { announce, announceAudio } from "@/server/rooms"
import { buildAnnounceFormSchema } from "@/schemas/broadcast"
import { cn } from "@/lib/utils"
import { isDemoMode } from "@/lib/demo"
import type {
	AnnounceDelivery,
	DeliveryCardProps,
	AnnounceControlProps,
} from "@/types/broadcast"

function DeliveryCard({
	active,
	disabled,
	onClick,
	icon: Icon,
	title,
	desc,
}: DeliveryCardProps) {
	return (
		<button
			type="button"
			disabled={disabled}
			onClick={onClick}
			className={cn(
				"flex items-start gap-2 rounded-lg border p-3 text-left transition-colors disabled:opacity-50",
				active ? "border-primary bg-primary/5" : "border-border hover:bg-muted",
			)}
		>
			<span
				className={cn(
					"flex size-8 shrink-0 items-center justify-center rounded-md",
					active
						? "bg-primary text-primary-foreground"
						: "bg-muted text-muted-foreground",
				)}
			>
				<Icon className="size-4" />
			</span>
			<span className="flex flex-col">
				<span className="text-sm font-medium">{title}</span>
				<span className="text-muted-foreground text-xs">{desc}</span>
			</span>
		</button>
	)
}

export function AnnounceControl({
	domias,
	onSent,
	initialTarget,
}: AnnounceControlProps) {
	const demo = isDemoMode()

	const form = useForm({
		defaultValues: {
			text: "",
			clip: null as string | null,
			delivery: "domia-voice" as AnnounceDelivery,
			targets:
				initialTarget && domias.some((d) => d.domiaKey === initialTarget)
					? [initialTarget]
					: ([] as string[]),
		},
		validators: { onChange: buildAnnounceFormSchema() },
		onSubmit: async ({ value }) => {
			const list = value.targets
			const body = value.text.trim()
			const clip = value.clip
			const delivery: AnnounceDelivery = clip ? value.delivery : "domia-voice"
			const broadcastId = crypto.randomUUID()
			const settled = await Promise.allSettled(
				list.map((domiaKey) =>
					clip
						? announceAudio({
								data: {
									domiaKey,
									audioBase64: clip,
									mode: delivery === "original" ? "voice" : "transcribe",
									broadcastId,
								},
							})
						: announce({ data: { domiaKey, text: body, broadcastId } }),
				),
			)
			let delivered = 0
			let failed = 0
			let firstError: string | undefined
			for (const s of settled) {
				if (s.status === "fulfilled" && s.value.ok && s.value.data?.delivered) {
					delivered++
				} else {
					failed++
					if (!firstError)
						firstError =
							s.status === "fulfilled" && !s.value.ok
								? s.value.error
								: undefined
				}
			}
			if (delivered > 0) {
				toast.success(
					failed > 0
						? m.toast_announce_sent_partial({ count: delivered, failed })
						: m.toast_announce_sent({ count: delivered }),
				)
				onSent()
				form.setFieldValue("text", "")
				form.setFieldValue("clip", null)
			} else {
				toast.error(m.toast_announce_none_played(), {
					description: firstError ? errText(firstError) : undefined,
				})
			}
		},
	})

	const recorder = useAudioRecorder((base64) =>
		form.setFieldValue("clip", base64),
	)

	const allKeys = domias.map((d) => d.domiaKey)

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				e.stopPropagation()
				void form.handleSubmit()
			}}
		>
			<form.Subscribe selector={(s) => s.values}>
				{(values) => {
					const clip = values.clip
					const effectiveDelivery: AnnounceDelivery = clip
						? values.delivery
						: "domia-voice"
					const allSelected =
						allKeys.length > 0 &&
						allKeys.every((k) => values.targets.includes(k))
					const toggleTarget = (key: string) =>
						form.setFieldValue(
							"targets",
							values.targets.includes(key)
								? values.targets.filter((k) => k !== key)
								: [...values.targets, key],
						)

					return (
						<div className="flex flex-col gap-5">
							<div className="flex flex-col gap-2">
								<p className="text-muted-foreground text-xs font-medium uppercase">
									{m.broadcast_message()}
								</p>
								{clip ? (
									<div className="border-border bg-muted/20 flex flex-col gap-2 rounded-lg border p-3">
										<div className="flex items-center gap-2 text-sm">
											<Volume2 className="text-primary size-4" />
											<span className="font-medium">
												{m.broadcast_voice_clip()}
											</span>
											<Button
												variant="ghost"
												size="sm"
												className="ml-auto"
												disabled={demo}
												onClick={() => form.setFieldValue("clip", null)}
											>
												<X className="size-3.5" /> {m.chat_discard()}
											</Button>
										</div>
										<audio
											controls
											src={`data:audio/wav;base64,${clip}`}
											className="h-9 w-full"
										/>
									</div>
								) : (
									<form.Field name="text">
										{(field) => (
											<InputGroup>
												<InputGroupTextarea
													value={field.state.value}
													onChange={(e) => field.handleChange(e.target.value)}
													onBlur={field.handleBlur}
													onKeyDown={(e) => {
														if (e.key === "Enter" && !e.shiftKey) {
															e.preventDefault()
															void form.handleSubmit()
														}
													}}
													placeholder={m.broadcast_text_placeholder()}
													disabled={demo || recorder.recording}
													rows={2}
												/>
												<InputGroupAddon align="block-end" className="pt-1">
													<InputGroupButton
														type="button"
														size="icon-sm"
														variant={recorder.recording ? "default" : "outline"}
														disabled={demo || recorder.converting}
														className={
															recorder.recording ? "animate-pulse" : ""
														}
														onClick={
															recorder.recording
																? recorder.stop
																: recorder.start
														}
													>
														{recorder.converting ? (
															<Loader2 className="size-4 animate-spin" />
														) : recorder.recording ? (
															<Square className="size-4" />
														) : (
															<Mic className="size-4" />
														)}
													</InputGroupButton>
													{recorder.recording ? (
														<RecordingIndicator
															seconds={recorder.seconds}
															level={recorder.level}
														/>
													) : (
														<span className="text-muted-foreground text-xs">
															{m.broadcast_record_audio()}
														</span>
													)}
												</InputGroupAddon>
											</InputGroup>
										)}
									</form.Field>
								)}
							</div>

							<div className="flex flex-col gap-1.5">
								<p className="text-muted-foreground text-xs font-medium uppercase">
									{m.broadcast_playback_voice()}
								</p>
								<div className="grid gap-2 sm:grid-cols-2">
									<DeliveryCard
										active={effectiveDelivery === "domia-voice"}
										onClick={() =>
											form.setFieldValue("delivery", "domia-voice")
										}
										icon={Radio}
										title={m.broadcast_domia_voice()}
										desc={m.broadcast_domia_voice_desc()}
									/>
									<DeliveryCard
										active={effectiveDelivery === "original"}
										disabled={!clip}
										onClick={() => form.setFieldValue("delivery", "original")}
										icon={Volume2}
										title={m.broadcast_original_audio()}
										desc={
											clip
												? m.broadcast_original_desc_ready()
												: m.broadcast_original_desc_record()
										}
									/>
								</div>
							</div>

							<div className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<p className="text-muted-foreground text-xs font-medium uppercase">
										Targets ({values.targets.length})
									</p>
									<button
										type="button"
										disabled={demo || domias.length === 0}
										onClick={() =>
											form.setFieldValue("targets", allSelected ? [] : allKeys)
										}
										className="text-primary text-xs font-medium hover:underline disabled:opacity-50"
									>
										{allSelected
											? m.broadcast_clear_all()
											: m.broadcast_select_all()}
									</button>
								</div>
								<div className="flex flex-wrap gap-2">
									{domias.map((d) => {
										const on = values.targets.includes(d.domiaKey)
										return (
											<button
												key={d.domiaKey}
												type="button"
												disabled={demo}
												onClick={() => toggleTarget(d.domiaKey)}
												className={cn(
													"flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 text-sm font-medium transition-colors",
													on
														? "border-primary bg-primary/10 text-foreground"
														: "border-border text-muted-foreground hover:bg-muted",
													!d.online && "opacity-60",
												)}
											>
												<PersonaAvatar
													domiaKey={d.domiaKey}
													name={d.name}
													avatarId={null}
													size="sm"
												/>
												{d.name}
												{on && <Check className="text-primary size-3.5" />}
											</button>
										)
									})}
								</div>
							</div>

							<div className="border-border flex items-center justify-between border-t pt-4">
								<Badge
									variant="outline"
									className="text-[10px] tracking-wide uppercase"
								>
									{clip ? m.broadcast_audio() : m.broadcast_text()} ·{" "}
									{effectiveDelivery === "original"
										? m.broadcast_original()
										: m.broadcast_domia_voice()}
								</Badge>
								<form.Subscribe
									selector={(s) => [s.isSubmitting, s.canSubmit] as const}
								>
									{([isSubmitting, canSubmit]) => (
										<Button
											type="submit"
											disabled={demo || isSubmitting || !canSubmit}
										>
											{isSubmitting ? (
												<Loader2 className="size-4 animate-spin" />
											) : (
												<Megaphone className="size-4" />
											)}
											{m.broadcast_send()}
										</Button>
									)}
								</form.Subscribe>
							</div>
						</div>
					)
				}}
			</form.Subscribe>
		</form>
	)
}
