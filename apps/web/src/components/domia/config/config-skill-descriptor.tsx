import { Plus, Trash2 } from "lucide-react"
import { m } from "@/paraglide/messages"
import { locales } from "@/paraglide/runtime"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type {
	DomiaSkillDescriptor,
	SkillDescriptorI18n,
	SkillExecutionDescriptor,
	SkillFinalizeMode,
	SkillFinalizeRule,
	SkillRoutingDescriptor,
} from "@/types/config"

const FINALIZE_MODES: { value: SkillFinalizeMode; label: () => string }[] = [
	{ value: "agent_loop", label: m.config_desc_mode_agent_loop },
	{ value: "template", label: m.config_desc_mode_template },
	{ value: "async", label: m.config_desc_mode_async },
	{ value: "deadline", label: m.config_desc_mode_deadline },
]

function Field({
	label,
	hint,
	children,
}: {
	label: string
	hint?: string
	children: React.ReactNode
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs">{label}</Label>
			{children}
			{hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
		</div>
	)
}

function StringListField({
	label,
	value,
	onChange,
	multiline,
	placeholder,
}: {
	label: string
	value?: string[]
	onChange: (v: string[]) => void
	multiline?: boolean
	placeholder?: string
}) {
	const text = (value ?? []).join(multiline ? "\n" : ", ")
	const parse = (raw: string): string[] =>
		raw
			.split(multiline ? /[\n,]/ : ",")
			.map((s) => s.trim())
			.filter(Boolean)
	return (
		<Field label={label}>
			{multiline ? (
				<Textarea
					value={text}
					onChange={(e) => onChange(parse(e.target.value))}
					rows={2}
					placeholder={placeholder}
					spellCheck={false}
				/>
			) : (
				<Input
					value={text}
					onChange={(e) => onChange(parse(e.target.value))}
					placeholder={placeholder}
				/>
			)}
		</Field>
	)
}

function KeyValueListField({
	label,
	addLabel,
	value,
	onChange,
	keyLabel,
	valuesLabel,
	keyPlaceholder,
}: {
	label: string
	addLabel: string
	value?: Record<string, string[]>
	onChange: (v: Record<string, string[]>) => void
	keyLabel: string
	valuesLabel: string
	keyPlaceholder?: string
}) {
	const rows = Object.entries(value ?? {})
	const emit = (next: [string, string[]][]) =>
		onChange(Object.fromEntries(next))
	const setKey = (i: number, key: string) =>
		emit(rows.map((r, idx) => (idx === i ? [key, r[1]] : r)))
	const setVals = (i: number, vals: string[]) =>
		emit(rows.map((r, idx) => (idx === i ? [r[0], vals] : r)))
	const remove = (i: number) => emit(rows.filter((_, idx) => idx !== i))
	const add = () => emit([...rows, ["", []]])
	const parse = (raw: string) =>
		raw
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean)

	return (
		<Field label={label}>
			<div className="space-y-2">
				{rows.map(([key, vals], i) => (
					<div key={i} className="grid grid-cols-[10rem_1fr_auto] gap-2">
						<Input
							value={key}
							onChange={(e) => setKey(i, e.target.value)}
							placeholder={keyPlaceholder ?? keyLabel}
							aria-label={keyLabel}
						/>
						<Input
							value={vals.join(", ")}
							onChange={(e) => setVals(i, parse(e.target.value))}
							placeholder={valuesLabel}
							aria-label={valuesLabel}
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-destructive h-9 px-2"
							onClick={() => remove(i)}
						>
							<Trash2 className="size-3.5" />
						</Button>
					</div>
				))}
				<Button type="button" variant="outline" size="sm" onClick={add}>
					<Plus className="size-3.5" />
					{addLabel}
				</Button>
			</div>
		</Field>
	)
}

function KeyEnumMapField({
	label,
	addLabel,
	value,
	onChange,
	keyLabel,
}: {
	label: string
	addLabel: string
	value?: Record<string, "allow" | "block">
	onChange: (v: Record<string, "allow" | "block">) => void
	keyLabel: string
}) {
	const rows = Object.entries(value ?? {})
	const emit = (next: [string, "allow" | "block"][]) =>
		onChange(Object.fromEntries(next))
	const setKey = (i: number, key: string) =>
		emit(rows.map((r, idx) => (idx === i ? [key, r[1]] : r)))
	const setVal = (i: number, v: "allow" | "block") =>
		emit(rows.map((r, idx) => (idx === i ? [r[0], v] : r)))
	const remove = (i: number) => emit(rows.filter((_, idx) => idx !== i))
	const add = () => emit([...rows, ["", "allow"]])

	return (
		<Field label={label}>
			<div className="space-y-2">
				{rows.map(([key, v], i) => (
					<div key={i} className="grid grid-cols-[1fr_8rem_auto] gap-2">
						<Input
							value={key}
							onChange={(e) => setKey(i, e.target.value)}
							placeholder={keyLabel}
							aria-label={keyLabel}
						/>
						<Select
							value={v}
							onValueChange={(nv) => setVal(i, nv as "allow" | "block")}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="allow">
									{m.config_desc_policy_allow()}
								</SelectItem>
								<SelectItem value="block">
									{m.config_desc_policy_block()}
								</SelectItem>
							</SelectContent>
						</Select>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-destructive h-9 px-2"
							onClick={() => remove(i)}
						>
							<Trash2 className="size-3.5" />
						</Button>
					</div>
				))}
				<Button type="button" variant="outline" size="sm" onClick={add}>
					<Plus className="size-3.5" />
					{addLabel}
				</Button>
			</div>
		</Field>
	)
}

function FinalizeField({
	value,
	onChange,
}: {
	value?: Record<string, SkillFinalizeRule>
	onChange: (v: Record<string, SkillFinalizeRule>) => void
}) {
	const rows = Object.entries(value ?? {})
	const emit = (next: [string, SkillFinalizeRule][]) =>
		onChange(Object.fromEntries(next))
	const setKey = (i: number, key: string) =>
		emit(rows.map((r, idx) => (idx === i ? [key, r[1]] : r)))
	const setRule = (i: number, patch: Partial<SkillFinalizeRule>) =>
		emit(rows.map((r, idx) => (idx === i ? [r[0], { ...r[1], ...patch }] : r)))
	const remove = (i: number) => emit(rows.filter((_, idx) => idx !== i))
	const add = () => emit([...rows, ["", { mode: "agent_loop" }]])

	return (
		<Field label={m.config_desc_finalize()}>
			<div className="space-y-3">
				{rows.map(([key, rule], i) => {
					const timed = rule.mode === "deadline" || rule.mode === "async"
					return (
						<div key={i} className="space-y-2 rounded-md border p-3">
							<div className="grid grid-cols-[1fr_9rem_auto] gap-2">
								<Input
									value={key}
									onChange={(e) => setKey(i, e.target.value)}
									placeholder={m.config_desc_finalize_tool()}
									aria-label={m.config_desc_finalize_tool()}
								/>
								<Select
									value={rule.mode}
									onValueChange={(v) =>
										setRule(i, { mode: v as SkillFinalizeMode })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{FINALIZE_MODES.map((mo) => (
											<SelectItem key={mo.value} value={mo.value}>
												{mo.label()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-muted-foreground hover:text-destructive h-9 px-2"
									onClick={() => remove(i)}
								>
									<Trash2 className="size-3.5" />
								</Button>
							</div>
							<div className="grid gap-2 sm:grid-cols-3">
								<Field label={m.config_desc_ack()}>
									<Input
										value={rule.ack ?? ""}
										onChange={(e) => setRule(i, { ack: e.target.value })}
									/>
								</Field>
								<Field label={m.config_desc_error()}>
									<Input
										value={rule.error ?? ""}
										onChange={(e) => setRule(i, { error: e.target.value })}
									/>
								</Field>
								<Field label={m.config_desc_done()}>
									<Input
										value={rule.done ?? ""}
										onChange={(e) => setRule(i, { done: e.target.value })}
									/>
								</Field>
							</div>
							{timed && (
								<Field label={m.config_desc_ack_after_ms()}>
									<Input
										type="number"
										value={rule.ackAfterMs ?? ""}
										onChange={(e) =>
											setRule(i, {
												ackAfterMs:
													e.target.value === ""
														? undefined
														: Number(e.target.value),
											})
										}
									/>
								</Field>
							)}
						</div>
					)
				})}
				<Button type="button" variant="outline" size="sm" onClick={add}>
					<Plus className="size-3.5" />
					{m.config_desc_add_finalize()}
				</Button>
			</div>
		</Field>
	)
}

function LocaleOverrides({
	locale,
	value,
	onChange,
}: {
	locale: string
	value?: SkillDescriptorI18n
	onChange: (v: SkillDescriptorI18n) => void
}) {
	const entry = value ?? {}
	const patch = (p: Partial<SkillDescriptorI18n>) =>
		onChange({ ...entry, ...p })
	return (
		<div className="space-y-3 rounded-md border p-3">
			<p className="text-xs font-medium">
				{m.config_desc_locale_overrides({ locale })}
			</p>
			<KeyValueListField
				label={m.config_desc_aliases()}
				addLabel={m.config_desc_add_alias()}
				value={entry.aliases}
				onChange={(aliases) => patch({ aliases })}
				keyLabel={m.config_desc_alias_key()}
				valuesLabel={m.config_desc_alias_values()}
			/>
			<StringListField
				label={m.config_desc_examples()}
				value={entry.exampleUtterances}
				onChange={(exampleUtterances) => patch({ exampleUtterances })}
				multiline
			/>
			<StringListField
				label={m.config_desc_keywords()}
				value={entry.keywords}
				onChange={(keywords) => patch({ keywords })}
			/>
			<StringListField
				label={m.config_desc_generic_words()}
				value={entry.genericWords}
				onChange={(genericWords) => patch({ genericWords })}
			/>
			<FinalizeField
				value={entry.finalize}
				onChange={(finalize) => patch({ finalize })}
			/>
		</div>
	)
}

export function ConfigSkillDescriptor({
	value,
	onChange,
}: {
	value?: DomiaSkillDescriptor
	onChange: (d: DomiaSkillDescriptor) => void
}) {
	const d: DomiaSkillDescriptor = value ?? { version: 1 }
	const routing: SkillRoutingDescriptor = d.routing ?? {}
	const execution: SkillExecutionDescriptor = d.execution ?? {}
	const emit = (next: DomiaSkillDescriptor) => onChange({ ...next, version: 1 })
	const setRouting = (patch: Partial<SkillRoutingDescriptor>) =>
		emit({ ...d, routing: { ...routing, ...patch } })
	const setExecution = (patch: Partial<SkillExecutionDescriptor>) =>
		emit({ ...d, execution: { ...execution, ...patch } })
	const setI18n = (locale: string, entry: SkillDescriptorI18n) =>
		emit({ ...d, i18n: { ...(d.i18n ?? {}), [locale]: entry } })

	return (
		<div className="space-y-4">
			<p className="text-sm font-medium">{m.config_desc_title()}</p>

			<div className="grid gap-3 sm:grid-cols-2">
				<Field label={m.config_desc_kind()}>
					<Input
						value={d.kind ?? ""}
						onChange={(e) => emit({ ...d, kind: e.target.value })}
						placeholder="home_assistant"
					/>
				</Field>
			</div>
			<Field label={m.config_desc_description()}>
				<Textarea
					value={d.description ?? ""}
					onChange={(e) => emit({ ...d, description: e.target.value })}
					rows={2}
				/>
			</Field>

			<div className="space-y-3 border-t pt-3">
				<p className="text-xs font-semibold tracking-wide uppercase opacity-70">
					{m.config_desc_routing()}
				</p>
				<KeyValueListField
					label={m.config_desc_aliases()}
					addLabel={m.config_desc_add_alias()}
					value={routing.aliases}
					onChange={(aliases) => setRouting({ aliases })}
					keyLabel={m.config_desc_alias_key()}
					valuesLabel={m.config_desc_alias_values()}
				/>
				<StringListField
					label={m.config_desc_examples()}
					value={routing.exampleUtterances}
					onChange={(exampleUtterances) => setRouting({ exampleUtterances })}
					multiline
				/>
				<StringListField
					label={m.config_desc_keywords()}
					value={routing.keywords}
					onChange={(keywords) => setRouting({ keywords })}
				/>
			</div>

			<div className="space-y-3 border-t pt-3">
				<p className="text-xs font-semibold tracking-wide uppercase opacity-70">
					{m.config_desc_execution()}
				</p>
				<StringListField
					label={m.config_desc_core_tools()}
					value={execution.coreTools}
					onChange={(coreTools) => setExecution({ coreTools })}
				/>
				<KeyEnumMapField
					label={m.config_desc_tool_policy()}
					addLabel={m.config_desc_add_policy()}
					value={execution.toolPolicy}
					onChange={(toolPolicy) => setExecution({ toolPolicy })}
					keyLabel={m.config_desc_finalize_tool()}
				/>
				<KeyValueListField
					label={m.config_desc_param_allow()}
					addLabel={m.config_desc_add_param()}
					value={execution.paramAllow}
					onChange={(paramAllow) => setExecution({ paramAllow })}
					keyLabel={m.config_desc_finalize_tool()}
					valuesLabel={m.config_desc_param_allow()}
				/>
				<p className="text-muted-foreground text-[11px]">
					{m.config_desc_param_allow_supersedes()}
				</p>
				<StringListField
					label={m.config_desc_generic_words()}
					value={execution.genericWords}
					onChange={(genericWords) => setExecution({ genericWords })}
				/>
				<FinalizeField
					value={execution.finalize}
					onChange={(finalize) => setExecution({ finalize })}
				/>
			</div>

			<div className="space-y-3 border-t pt-3">
				<p className="text-xs font-semibold tracking-wide uppercase opacity-70">
					{m.config_desc_i18n()}
				</p>
				{locales.map((locale) => (
					<LocaleOverrides
						key={locale}
						locale={locale}
						value={d.i18n?.[locale]}
						onChange={(entry) => setI18n(locale, entry)}
					/>
				))}
			</div>
		</div>
	)
}
