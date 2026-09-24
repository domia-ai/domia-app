import { Plus, Trash2 } from "lucide-react"
import { m } from "@/paraglide/messages"
import { locales } from "@/paraglide/runtime"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ListInput } from "@/components/ui/list-input"
import { Textarea } from "@/components/ui/textarea"
import { useKeyedRows } from "@/components/ui/keyed-rows"
import {
	DescriptorField,
	DuplicateKeyIssue,
	KeyValueMapField,
} from "@/components/domia/config/descriptor-fields"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	ConfigFastPath,
	ToolChecklist,
} from "@/components/domia/config/config-fast-path"
import { SKILL_DESCRIPTOR_KINDS } from "@/constants/skill-presets"
import { DESCRIPTOR_COUNTER_LABELS } from "@/constants/skills"
import { descriptorCounters } from "@/schemas/descriptor"
import {
	descriptorIssues,
	fastPathIntentDropped,
	pruneDescriptor,
} from "@/utils/skill-providers"
import { cn } from "@/lib/utils"
import type {
	ConfigSkillDescriptorProps,
	DescriptorChecksProps,
	DomiaSkillDescriptor,
	FinalizeFieldProps,
	KeyEnumMapFieldProps,
	LocaleOverridesProps,
	SkillDescriptorI18n,
	SkillExecutionDescriptor,
	SkillFinalizeMode,
	SkillFinalizeRule,
	SkillRoutingDescriptor,
	StringListFieldProps,
} from "@/types/config"
import type { SkillToolPolicy } from "@/types/skills"

const FINALIZE_MODES: { value: SkillFinalizeMode; label: () => string }[] = [
	{ value: "agent_loop", label: m.config_desc_mode_agent_loop },
	{ value: "template", label: m.config_desc_mode_template },
	{ value: "async", label: m.config_desc_mode_async },
	{ value: "deadline", label: m.config_desc_mode_deadline },
]

const TOOL_POLICIES: { value: SkillToolPolicy; label: () => string }[] = [
	{ value: "allow", label: m.config_desc_policy_allow },
	{ value: "confirm", label: m.config_desc_policy_confirm },
	{ value: "block", label: m.config_desc_policy_block },
]

const CUSTOM_KIND = "__custom"

function StringListField({
	label,
	value,
	onChange,
	multiline = false,
	placeholder,
}: StringListFieldProps) {
	return (
		<DescriptorField label={label}>
			<ListInput
				value={value ?? []}
				onChange={onChange}
				multiline={multiline}
				rows={2}
				placeholder={placeholder}
				aria-label={label}
			/>
		</DescriptorField>
	)
}

function KeyEnumMapField({
	label,
	addLabel,
	value,
	onChange,
	keyLabel,
}: KeyEnumMapFieldProps) {
	const { rows, setRows: emit } = useKeyedRows(value, onChange)
	const setKey = (i: number, key: string) =>
		emit(rows.map((r, idx) => (idx === i ? [key, r[1]] : r)))
	const setVal = (i: number, v: SkillToolPolicy) =>
		emit(rows.map((r, idx) => (idx === i ? [r[0], v] : r)))
	const remove = (i: number) => emit(rows.filter((_, idx) => idx !== i))
	const add = () => emit([...rows, ["", "allow"]])

	return (
		<DescriptorField label={label}>
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
							onValueChange={(nv) => setVal(i, nv as SkillToolPolicy)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{TOOL_POLICIES.map((policy) => (
									<SelectItem key={policy.value} value={policy.value}>
										{policy.label()}
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
				))}
				<DuplicateKeyIssue rows={rows} />
				<Button type="button" variant="outline" size="sm" onClick={add}>
					<Plus className="size-3.5" />
					{addLabel}
				</Button>
			</div>
		</DescriptorField>
	)
}

function FinalizeField({ value, onChange }: FinalizeFieldProps) {
	const { rows, setRows: emit } = useKeyedRows(value, onChange)
	const setKey = (i: number, key: string) =>
		emit(rows.map((r, idx) => (idx === i ? [key, r[1]] : r)))
	const setRule = (i: number, patch: Partial<SkillFinalizeRule>) =>
		emit(rows.map((r, idx) => (idx === i ? [r[0], { ...r[1], ...patch }] : r)))
	const remove = (i: number) => emit(rows.filter((_, idx) => idx !== i))
	const add = () => emit([...rows, ["", { mode: "agent_loop" }]])

	return (
		<DescriptorField label={m.config_desc_finalize()}>
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
								<DescriptorField label={m.config_desc_ack()}>
									<Input
										value={rule.ack ?? ""}
										onChange={(e) => setRule(i, { ack: e.target.value })}
									/>
								</DescriptorField>
								<DescriptorField label={m.config_desc_error()}>
									<Input
										value={rule.error ?? ""}
										onChange={(e) => setRule(i, { error: e.target.value })}
									/>
								</DescriptorField>
								<DescriptorField label={m.config_desc_done()}>
									<Input
										value={rule.done ?? ""}
										onChange={(e) => setRule(i, { done: e.target.value })}
									/>
								</DescriptorField>
							</div>
							{timed && (
								<DescriptorField label={m.config_desc_ack_after_ms()}>
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
								</DescriptorField>
							)}
						</div>
					)
				})}
				<DuplicateKeyIssue rows={rows} />
				<Button type="button" variant="outline" size="sm" onClick={add}>
					<Plus className="size-3.5" />
					{m.config_desc_add_finalize()}
				</Button>
			</div>
		</DescriptorField>
	)
}

function LocaleOverrides({
	locale,
	value,
	options,
	onChange,
}: LocaleOverridesProps) {
	const entry = value ?? {}
	const patch = (p: Partial<SkillDescriptorI18n>) =>
		onChange({ ...entry, ...p })
	return (
		<div className="space-y-3 rounded-md border p-3">
			<p className="text-xs font-medium">
				{m.config_desc_locale_overrides({ locale })}
			</p>
			<KeyValueMapField
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
			<ConfigFastPath
				scope={locale}
				value={entry.fastPath}
				options={options}
				onChange={(fastPath) => patch({ fastPath })}
			/>
		</div>
	)
}

function DescriptorChecks({ value, limits }: DescriptorChecksProps) {
	const pruned = pruneDescriptor(value)
	const errors = descriptorIssues(value)
	const counters = descriptorCounters(pruned, limits.limits)
	const dropped =
		fastPathIntentDropped(value.fastPath) +
		Object.values(value.i18n ?? {}).reduce(
			(n, entry) => n + fastPathIntentDropped(entry.fastPath),
			0,
		)

	return (
		<div className="space-y-2 border-t pt-3">
			<div className="space-y-0.5">
				<p className="text-xs font-semibold tracking-wide uppercase opacity-70">
					{m.desc_limits_title()}
				</p>
				<p className="text-muted-foreground text-[11px]">
					{m.desc_limits_hint()}
				</p>
				{!limits.fromNode && (
					<p className="text-muted-foreground text-[11px]">
						{m.desc_limits_offline()}
					</p>
				)}
			</div>

			<div className="flex flex-wrap gap-1.5">
				{counters.map((counter) => (
					<span
						key={counter.id}
						className={cn(
							"rounded-md border px-1.5 py-0.5 text-[11px]",
							counter.used > counter.max &&
								"border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400",
						)}
					>
						{DESCRIPTOR_COUNTER_LABELS[counter.id]()}{" "}
						<span className="font-mono">
							{counter.used}/{counter.max}
						</span>
					</span>
				))}
			</div>

			{dropped > 0 && (
				<p className="text-muted-foreground text-[11px]">
					{m.desc_intents_dropped({ count: dropped })}
				</p>
			)}

			{limits.stripped.length > 0 && (
				<p className="text-muted-foreground text-[11px]">
					{m.desc_server_strips({
						uri: limits.resourceUri ?? "domia://descriptor",
					})}{" "}
					<span className="font-mono">{limits.stripped.join(", ")}</span>
					{limits.rejected.length > 0 && (
						<>
							{" "}
							{m.desc_server_rejects()}{" "}
							<span className="font-mono">{limits.rejected.join(", ")}</span>
						</>
					)}
				</p>
			)}

			{errors.length > 0 && (
				<div className="space-y-1">
					<p className="text-destructive text-[11px] font-medium">
						{m.desc_invalid_title()}
					</p>
					<ul className="text-destructive space-y-0.5 text-[11px]">
						{errors.map((error) => (
							<li key={error} className="font-mono">
								{error}
							</li>
						))}
					</ul>
				</div>
			)}
		</div>
	)
}

export function ConfigSkillDescriptor({
	value,
	onChange,
	options,
	limits,
	kindLocked = false,
}: ConfigSkillDescriptorProps) {
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
	const knownKind = SKILL_DESCRIPTOR_KINDS.some((k) => k.id === d.kind)

	return (
		<div className="space-y-4">
			<p className="text-sm font-medium">{m.config_desc_title()}</p>

			<div className="grid gap-3 sm:grid-cols-2">
				<DescriptorField
					label={m.config_desc_kind()}
					hint={m.config_desc_kind_hint()}
				>
					<Select
						value={knownKind ? (d.kind as string) : CUSTOM_KIND}
						onValueChange={(v) =>
							emit({ ...d, kind: !v || v === CUSTOM_KIND ? "" : v })
						}
						disabled={kindLocked}
					>
						<SelectTrigger>
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{SKILL_DESCRIPTOR_KINDS.map((kind) => (
								<SelectItem key={kind.id} value={kind.id}>
									{kind.label()}
								</SelectItem>
							))}
							<SelectItem value={CUSTOM_KIND}>
								{m.config_desc_kind_custom()}
							</SelectItem>
						</SelectContent>
					</Select>
				</DescriptorField>
				{!knownKind && !kindLocked && (
					<DescriptorField label={m.config_desc_kind_custom()}>
						<Input
							value={d.kind ?? ""}
							onChange={(e) => emit({ ...d, kind: e.target.value })}
							placeholder={m.desc_kind_custom_placeholder()}
						/>
					</DescriptorField>
				)}
			</div>
			<DescriptorField label={m.config_desc_description()}>
				<Textarea
					value={d.description ?? ""}
					onChange={(e) => emit({ ...d, description: e.target.value })}
					rows={2}
				/>
			</DescriptorField>

			<div className="space-y-3 border-t pt-3">
				<p className="text-xs font-semibold tracking-wide uppercase opacity-70">
					{m.config_desc_routing()}
				</p>
				<KeyValueMapField
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
				<KeyValueMapField
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
				<ToolChecklist
					label={m.desc_hidden_tools()}
					hint={m.desc_hidden_tools_hint()}
					value={execution.hiddenTools ?? []}
					onChange={(hiddenTools) => setExecution({ hiddenTools })}
					options={options}
					placeholder={m.desc_hidden_tools_placeholder()}
				/>
			</div>

			<div className="space-y-3 border-t pt-3">
				<div className="space-y-0.5">
					<p className="text-xs font-semibold tracking-wide uppercase opacity-70">
						{m.desc_fast_path()}
					</p>
					<p className="text-muted-foreground text-[11px]">
						{m.desc_fast_path_hint()}
					</p>
				</div>
				<ConfigFastPath
					scope={m.desc_fast_path_scope_base()}
					value={d.fastPath}
					options={options}
					onChange={(fastPath) => emit({ ...d, fastPath })}
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
						options={options}
						onChange={(entry) => setI18n(locale, entry)}
					/>
				))}
			</div>

			<DescriptorChecks value={d} limits={limits} />
		</div>
	)
}
