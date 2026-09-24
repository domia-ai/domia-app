import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ChevronDown, Loader2, Save, SlidersHorizontal, X } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { isDemoMode } from "@/lib/demo"
import { applyNeedsAttention, summarizeApply } from "@/lib/config-apply"
import { setSatelliteSettingsFn } from "@/server/satellites"
import type {
	SatelliteSettingsDraft,
	SatelliteSettingsInput,
	SatelliteSettingsNumberField,
	SatelliteSettingsNumberMeta,
	SatelliteSettingsProps,
	SatelliteWithContext,
} from "@/types/satellites"

const NUMBER_FIELDS: readonly SatelliteSettingsNumberMeta[] = [
	{
		field: "followUpNoSpeechMs",
		label: m.satset_follow_up_no_speech,
		hint: m.satset_follow_up_no_speech_hint,
	},
	{
		field: "followUpRequestMaxMs",
		label: m.satset_follow_up_request_max,
		hint: m.satset_follow_up_request_max_hint,
	},
	{
		field: "playbackDrainMarginMs",
		label: m.satset_playback_drain_margin,
		hint: m.satset_playback_drain_margin_hint,
	},
	{
		field: "runListeningMaxMs",
		label: m.satset_run_listening_max,
		hint: m.satset_run_listening_max_hint,
	},
	{
		field: "captureHeadTrimMs",
		label: m.satset_capture_head_trim,
		hint: m.satset_capture_head_trim_hint,
	},
]

const draftOf = (s: SatelliteWithContext): SatelliteSettingsDraft => ({
	numbers: {
		followUpNoSpeechMs: String(s.followUpNoSpeechMs),
		followUpRequestMaxMs: String(s.followUpRequestMaxMs),
		playbackDrainMarginMs: String(s.playbackDrainMarginMs),
		runListeningMaxMs: String(s.runListeningMaxMs),
		captureHeadTrimMs: String(s.captureHeadTrimMs),
	},
	wyomingStreamingTts: s.wyomingStreamingTts,
	mediaPlayerName: s.mediaPlayerName ?? "",
})

const parseField = (raw: string): number | null => {
	const value = Number(raw.trim())
	if (!Number.isInteger(value) || value < 0) return null
	return value
}

const patchOf = (
	s: SatelliteWithContext,
	draft: SatelliteSettingsDraft,
): SatelliteSettingsInput | null => {
	const patch: SatelliteSettingsInput = {}
	for (const meta of NUMBER_FIELDS) {
		const value = parseField(draft.numbers[meta.field])
		if (value === null) return null
		if (value !== s[meta.field]) patch[meta.field] = value
	}
	if (draft.wyomingStreamingTts !== s.wyomingStreamingTts)
		patch.wyomingStreamingTts = draft.wyomingStreamingTts
	const name = draft.mediaPlayerName.trim()
	const nextName = name === "" ? null : name
	if (nextName !== (s.mediaPlayerName ?? null)) patch.mediaPlayerName = nextName
	return patch
}

export function SatelliteSettings({ satellite: s }: SatelliteSettingsProps) {
	const qc = useQueryClient()
	const [draft, setDraft] = useState<SatelliteSettingsDraft>(() => draftOf(s))

	const patch = patchOf(s, draft)
	const invalid = patch === null
	const dirty = patch !== null && Object.keys(patch).length > 0

	const mutation = useActionMutation({
		mutationFn: (settings: SatelliteSettingsInput) =>
			setSatelliteSettingsFn({
				data: { domiaKey: s.domiaKey, satelliteId: s.satelliteId, settings },
			}),
		failureTitle: m.satset_save_failed,
		onDone: (data) => {
			const apply = data?.apply
			if (apply && applyNeedsAttention(apply))
				toast.warning(m.satset_saved(), { description: summarizeApply(apply) })
			else toast.success(m.satset_saved())
			void qc.invalidateQueries({ queryKey: ["satellites-all"] })
			void qc.invalidateQueries({ queryKey: ["satellites", s.domiaKey] })
		},
	})

	const setNumber = (field: SatelliteSettingsNumberField, value: string) =>
		setDraft((prev) => ({
			...prev,
			numbers: { ...prev.numbers, [field]: value },
		}))

	const disabled = !s.online || isDemoMode() || mutation.isPending

	return (
		<Collapsible>
			<CollapsibleTrigger className="border-border hover:bg-muted/50 group flex w-full items-center justify-between rounded-md border px-3 py-2 text-sm font-medium outline-none">
				<span className="flex items-center gap-2">
					<SlidersHorizontal className="size-4" />
					{m.satset_title()}
				</span>
				<ChevronDown className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
			</CollapsibleTrigger>
			<CollapsibleContent className="pt-3">
				<div className="flex flex-col gap-3">
					<p className="text-muted-foreground text-xs">{m.satset_desc()}</p>

					{!s.online ? (
						<p className="text-muted-foreground text-xs">
							{m.satset_offline()}
						</p>
					) : null}

					<div className="flex flex-col gap-2.5">
						{NUMBER_FIELDS.map((meta) => {
							const raw = draft.numbers[meta.field]
							const bad = parseField(raw) === null
							return (
								<div key={meta.field} className="flex flex-col gap-1">
									<Label
										htmlFor={`${s.id}-${meta.field}`}
										className="text-xs font-medium"
									>
										{meta.label()}
									</Label>
									<div className="flex items-center gap-2">
										<Input
											id={`${s.id}-${meta.field}`}
											type="number"
											min={0}
											step={10}
											inputMode="numeric"
											value={raw}
											aria-invalid={bad}
											disabled={disabled}
											onChange={(e) => setNumber(meta.field, e.target.value)}
										/>
										<span className="text-muted-foreground text-xs">
											{m.satset_unit_ms()}
										</span>
									</div>
									<p className="text-muted-foreground text-[11px]">
										{meta.hint()}
									</p>
								</div>
							)
						})}
					</div>

					<div className="border-border flex items-start justify-between gap-3 rounded-md border px-3 py-2">
						<div className="min-w-0">
							<p className="text-sm font-medium">{m.satset_streaming_tts()}</p>
							<p className="text-muted-foreground text-[11px]">
								{m.satset_streaming_tts_hint()}
							</p>
						</div>
						<Switch
							checked={draft.wyomingStreamingTts}
							disabled={disabled}
							onCheckedChange={(on) =>
								setDraft((prev) => ({ ...prev, wyomingStreamingTts: on }))
							}
						/>
					</div>

					<div className="flex flex-col gap-1">
						<Label htmlFor={`${s.id}-media-player`} className="text-xs">
							{m.satset_media_player()}
						</Label>
						<div className="flex items-center gap-2">
							<Input
								id={`${s.id}-media-player`}
								value={draft.mediaPlayerName}
								placeholder={m.satset_media_player_placeholder()}
								disabled={disabled}
								onChange={(e) =>
									setDraft((prev) => ({
										...prev,
										mediaPlayerName: e.target.value,
									}))
								}
							/>
							<Button
								variant="ghost"
								size="sm"
								disabled={disabled || draft.mediaPlayerName === ""}
								aria-label={m.satset_media_player_clear()}
								onClick={() =>
									setDraft((prev) => ({ ...prev, mediaPlayerName: "" }))
								}
							>
								<X className="size-4" />
							</Button>
						</div>
						<p className="text-muted-foreground text-[11px]">
							{m.satset_media_player_hint()}
						</p>
					</div>

					{invalid ? (
						<p className="text-destructive text-xs">{m.satset_invalid()}</p>
					) : null}

					<div className="flex items-center justify-end gap-2">
						<Button
							variant="ghost"
							size="sm"
							disabled={!dirty || mutation.isPending}
							onClick={() => setDraft(draftOf(s))}
						>
							{m.satset_reset()}
						</Button>
						<Button
							size="sm"
							disabled={disabled || !dirty}
							onClick={() => patch && mutation.mutate(patch)}
						>
							{mutation.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Save className="size-4" />
							)}
							{m.satset_save()}
						</Button>
					</div>
				</div>
			</CollapsibleContent>
		</Collapsible>
	)
}
