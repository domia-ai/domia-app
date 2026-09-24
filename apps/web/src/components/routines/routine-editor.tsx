import { Check, Loader2, X } from "lucide-react"
import { m } from "@/paraglide/messages"
import { baseLocale } from "@/paraglide/runtime"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { RoutinePhrases } from "@/components/routines/routine-phrases"
import { RoutineSlots } from "@/components/routines/routine-slots"
import { RoutineSteps } from "@/components/routines/routine-steps"
import { RoutineTry } from "@/components/routines/routine-try"
import {
	ROUTINE_MAX_DESCRIPTION_CHARS,
	ROUTINE_MAX_NAME_CHARS,
	ROUTINE_SLUG_PATTERN,
	ROUTINE_TOOL_PREFIX,
	ROUTINE_UNSUPPORTED_SLOT_KINDS,
} from "@/constants/routines"
import { duplicateKeys } from "@/utils/scalar"
import { cn } from "@/lib/utils"
import type { RoutineDraft, RoutineEditorProps } from "@/types/routines"

const slotArgsOf = (draft: RoutineDraft): string[] =>
	draft.slots
		.map(([name, slot]) => slot.arg?.trim() || name.trim())
		.filter(Boolean)

const draftIssue = (draft: RoutineDraft): string | null => {
	if (!ROUTINE_SLUG_PATTERN.test(draft.slug)) return m.routine_issue_slug()
	if (!draft.name.trim()) return m.routine_issue_name()
	if (!draft.description.trim()) return m.routine_issue_description()
	if (draft.steps.length === 0 || draft.steps.some((s) => !s.tool.trim()))
		return m.routine_issue_steps()
	if ((draft.phrases[baseLocale] ?? []).length === 0)
		return m.routine_issue_phrases({ locale: baseLocale })
	if (!(draft.reply[baseLocale] ?? "").trim())
		return m.routine_issue_reply({ locale: baseLocale })
	if (draft.slots.some(([name]) => !name.trim()))
		return m.routine_issue_slot_name()
	if (duplicateKeys(draft.slots).size > 0)
		return m.routine_issue_slot_duplicate()
	if (draft.steps.some((step) => duplicateKeys(step.args).size > 0))
		return m.routine_issue_arg_duplicate()
	if (
		draft.slots.some(([, slot]) =>
			ROUTINE_UNSUPPORTED_SLOT_KINDS.includes(slot.source.kind),
		)
	)
		return m.routine_issue_slot_kind()
	return null
}

export function RoutineEditor({
	domiaKey,
	draft,
	online,
	saving,
	onChange,
	onSave,
	onCancel,
}: RoutineEditorProps) {
	const slugValid = ROUTINE_SLUG_PATTERN.test(draft.slug)
	const issue = draftIssue(draft)
	const toolName = `${ROUTINE_TOOL_PREFIX}${draft.slug}`

	return (
		<div className="border-border space-y-6 rounded-lg border p-4">
			<div className="flex flex-wrap items-start justify-between gap-3">
				<div className="space-y-1">
					<h2 className="text-base font-semibold">
						{draft.id ? m.routine_editor_edit() : m.routine_editor_new()}
					</h2>
					<p className="text-muted-foreground text-xs">
						{m.routine_editor_desc()}
					</p>
				</div>
				{slugValid ? (
					<Badge variant="secondary" className="font-mono text-[11px]">
						{toolName}
					</Badge>
				) : null}
			</div>

			<div className="grid gap-3 md:grid-cols-2">
				<div className="space-y-1.5">
					<Label htmlFor="routine-slug">{m.routine_field_slug()}</Label>
					<Input
						id="routine-slug"
						value={draft.slug}
						spellCheck={false}
						placeholder={m.routine_slug_placeholder()}
						className={cn("font-mono", !slugValid && "border-destructive/60")}
						onChange={(e) =>
							onChange({ ...draft, slug: e.target.value.toLowerCase() })
						}
					/>
					<p
						className={cn(
							"text-[11px]",
							slugValid ? "text-muted-foreground" : "text-destructive",
						)}
					>
						{slugValid
							? m.routine_slug_ok({ tool: toolName })
							: m.routine_slug_invalid()}
					</p>
				</div>
				<div className="space-y-1.5">
					<Label htmlFor="routine-name">{m.routine_field_name()}</Label>
					<Input
						id="routine-name"
						value={draft.name}
						maxLength={ROUTINE_MAX_NAME_CHARS}
						placeholder={m.routine_name_placeholder()}
						onChange={(e) => onChange({ ...draft, name: e.target.value })}
					/>
				</div>
			</div>

			<div className="space-y-1.5">
				<Label htmlFor="routine-description">
					{m.routine_field_description()}
				</Label>
				<Textarea
					id="routine-description"
					rows={2}
					value={draft.description}
					maxLength={ROUTINE_MAX_DESCRIPTION_CHARS}
					placeholder={m.routine_description_placeholder()}
					onChange={(e) => onChange({ ...draft, description: e.target.value })}
				/>
				<p className="text-muted-foreground text-[11px]">
					{m.routine_description_hint()}
				</p>
			</div>

			<div className="flex items-center gap-2">
				<Switch
					checked={draft.isActive}
					onCheckedChange={(v) => onChange({ ...draft, isActive: v })}
				/>
				<span className="text-sm">{m.routine_field_active()}</span>
			</div>

			<RoutinePhrases
				phrases={draft.phrases}
				reply={draft.reply}
				onPhrases={(phrases) => onChange({ ...draft, phrases })}
				onReply={(reply) => onChange({ ...draft, reply })}
			/>

			<RoutineSlots
				slots={draft.slots}
				onChange={(slots) => onChange({ ...draft, slots })}
			/>

			<RoutineSteps
				domiaKey={domiaKey}
				steps={draft.steps}
				slotArgs={slotArgsOf(draft)}
				onChange={(steps) => onChange({ ...draft, steps })}
			/>

			<RoutineTry
				domiaKey={domiaKey}
				expectedTool={toolName}
				disabled={!online}
			/>

			<div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
				{issue ? (
					<p className="text-muted-foreground mr-auto text-xs">{issue}</p>
				) : null}
				<Button variant="ghost" size="sm" onClick={onCancel}>
					<X className="size-4" />
					{m.routine_cancel()}
				</Button>
				<Button
					size="sm"
					disabled={!online || !!issue || saving}
					onClick={onSave}
				>
					{saving ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Check className="size-4" />
					)}
					{m.routine_save()}
				</Button>
			</div>
		</div>
	)
}
