import { useState } from "react"
import { Plus, Trash2, X } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ListInput } from "@/components/ui/list-input"
import { Switch } from "@/components/ui/switch"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	DescriptorField,
	DuplicateKeyIssue,
	KeyValueListField,
} from "@/components/domia/config/descriptor-fields"
import { useCodecRows, useKeyedRows } from "@/components/ui/keyed-rows"
import { RoutineSlots } from "@/components/routines/routine-slots"
import { SKILL_POLICY_BADGE_META } from "@/constants/skills"
import { skillToolBaseName } from "@/utils/skill-providers"
import { argRowsOf, argsFromRows } from "@/utils/scalar"
import { cn } from "@/lib/utils"
import type {
	ConfigFastPathProps,
	ExpansionRulesProps,
	IntentEditorProps,
	KeywordGroupsProps,
	SkillFastPathBlock,
	ToolChecklistProps,
} from "@/types/config"

const parsePriority = (raw: string): number | undefined => {
	const n = Number.parseInt(raw, 10)
	return Number.isFinite(n) ? n : undefined
}

export function ToolChecklist({
	label,
	hint,
	note,
	value,
	onChange,
	options,
	placeholder,
}: ToolChecklistProps) {
	const [extra, setExtra] = useState("")
	const known = options.tools.map((tool) => tool.rawName)
	const stale = value.filter((name) => !known.includes(name))
	const toggle = (name: string) =>
		onChange(
			value.includes(name) ? value.filter((n) => n !== name) : [...value, name],
		)
	const addExtra = () => {
		const name = extra.trim()
		if (name && !value.includes(name)) onChange([...value, name])
		setExtra("")
	}

	if (options.status !== "ready" || known.length === 0)
		return (
			<DescriptorField label={label} hint={hint}>
				<ListInput
					value={value}
					onChange={onChange}
					placeholder={placeholder}
				/>
				<p className="text-muted-foreground text-[11px]">
					{options.status === "loading"
						? m.fastpath_tools_loading()
						: options.status === "error"
							? m.fastpath_tools_error({
									error: options.message ?? m.err_request_failed(),
								})
							: m.fastpath_tools_none()}
				</p>
			</DescriptorField>
		)

	return (
		<DescriptorField label={label} hint={hint}>
			<div className="space-y-2">
				<div className="grid gap-1 sm:grid-cols-2">
					{options.tools.map((tool) => {
						const badge =
							tool.policy === "confirm" || tool.policy === "block"
								? SKILL_POLICY_BADGE_META[tool.policy]
								: null
						return (
							<label
								key={tool.rawName}
								className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs"
							>
								<Checkbox
									checked={value.includes(tool.rawName)}
									onCheckedChange={() => toggle(tool.rawName)}
								/>
								<span className="truncate font-mono">{tool.rawName}</span>
								{badge && (
									<Badge
										variant="outline"
										className={cn("shrink-0", badge.className)}
									>
										<badge.icon className="size-3" />
										{badge.label()}
									</Badge>
								)}
							</label>
						)
					})}
				</div>

				{stale.length > 0 && (
					<div className="space-y-1">
						<p className="text-muted-foreground text-[11px]">
							{m.fastpath_tools_stale()}
						</p>
						<div className="flex flex-wrap gap-1.5">
							{stale.map((name) => (
								<Button
									key={name}
									type="button"
									variant="outline"
									size="sm"
									className="h-6 gap-1 px-2 font-mono text-[11px]"
									onClick={() => onChange(value.filter((n) => n !== name))}
								>
									{name}
									<X className="size-3" />
								</Button>
							))}
						</div>
					</div>
				)}

				<div className="flex gap-2">
					<Input
						value={extra}
						aria-label={m.fastpath_tools_add_placeholder()}
						placeholder={m.fastpath_tools_add_placeholder()}
						onChange={(e) => setExtra(e.target.value)}
						onKeyDown={(e) => {
							if (e.key !== "Enter") return
							e.preventDefault()
							addExtra()
						}}
					/>
					<Button type="button" variant="outline" size="sm" onClick={addExtra}>
						<Plus className="size-3.5" />
						{m.fastpath_tools_add()}
					</Button>
				</div>

				{note && <p className="text-muted-foreground text-[11px]">{note}</p>}
			</div>
		</DescriptorField>
	)
}

function KeywordGroups({ groups, onChange }: KeywordGroupsProps) {
	return (
		<DescriptorField
			label={m.fastpath_required_keywords()}
			hint={m.fastpath_required_keywords_hint()}
		>
			<div className="space-y-2">
				{groups.map((group, i) => (
					<div key={i} className="grid grid-cols-[1fr_auto] gap-2">
						<ListInput
							value={group}
							aria-label={m.fastpath_required_keywords()}
							placeholder={m.fastpath_required_keywords_placeholder()}
							onChange={(next) =>
								onChange(groups.map((g, idx) => (idx === i ? next : g)))
							}
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-destructive h-9 px-2"
							onClick={() => onChange(groups.filter((_, idx) => idx !== i))}
						>
							<Trash2 className="size-3.5" />
						</Button>
					</div>
				))}
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => onChange([...groups, []])}
				>
					<Plus className="size-3.5" />
					{m.fastpath_required_keywords_add()}
				</Button>
			</div>
		</DescriptorField>
	)
}

function ExpansionRules({ rules, onChange }: ExpansionRulesProps) {
	const { rows, setRows } = useKeyedRows(rules, onChange)
	return (
		<DescriptorField
			label={m.fastpath_expansion_rules()}
			hint={m.fastpath_expansion_rules_hint()}
		>
			<div className="space-y-2">
				{rows.map(([name, pattern], i) => (
					<div key={i} className="grid grid-cols-[10rem_1fr_auto] gap-2">
						<Input
							value={name}
							aria-label={m.fastpath_expansion_name()}
							placeholder={m.fastpath_expansion_name()}
							onChange={(e) =>
								setRows(
									rows.map((r, idx) =>
										idx === i ? [e.target.value, r[1]] : r,
									),
								)
							}
						/>
						<Input
							value={pattern}
							aria-label={m.fastpath_expansion_pattern()}
							placeholder={m.fastpath_expansion_pattern()}
							className="font-mono text-xs"
							spellCheck={false}
							onChange={(e) =>
								setRows(
									rows.map((r, idx) =>
										idx === i ? [r[0], e.target.value] : r,
									),
								)
							}
						/>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-destructive h-9 px-2"
							onClick={() => setRows(rows.filter((_, idx) => idx !== i))}
						>
							<Trash2 className="size-3.5" />
						</Button>
					</div>
				))}
				<DuplicateKeyIssue rows={rows} />
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => setRows([...rows, ["", ""]])}
				>
					<Plus className="size-3.5" />
					{m.fastpath_expansion_add()}
				</Button>
			</div>
		</DescriptorField>
	)
}

function IntentEditor({
	index,
	intent,
	options,
	onChange,
	onRemove,
}: IntentEditorProps) {
	const templates = intent.templates ?? []
	const baseNames = [
		...new Set(options.tools.map((tool) => skillToolBaseName(tool.rawName))),
	].sort((a, b) => a.localeCompare(b))
	const hasPicker = options.status === "ready" && baseNames.length > 0
	const tool = intent.tool ?? ""
	const argRows = useCodecRows(
		intent.argDefaults,
		(argDefaults) => onChange({ ...intent, argDefaults }),
		{ toRows: argRowsOf, fromRows: argsFromRows },
	)
	const slotRows = useKeyedRows(intent.slots, (slots) =>
		onChange({ ...intent, slots }),
	)

	return (
		<div className="space-y-3 rounded-md border p-3">
			<div className="flex items-center gap-2">
				<Badge variant="secondary" className="font-mono text-[11px]">
					{index + 1}
				</Badge>
				{hasPicker ? (
					<Select
						value={tool}
						onValueChange={(v) => onChange({ ...intent, tool: v ?? "" })}
					>
						<SelectTrigger className="flex-1" aria-label={m.fastpath_tool()}>
							<SelectValue placeholder={m.fastpath_tool()} />
						</SelectTrigger>
						<SelectContent>
							{tool && !baseNames.includes(tool) && (
								<SelectItem value={tool}>
									{m.fastpath_tool_unknown({ tool })}
								</SelectItem>
							)}
							{baseNames.map((name) => (
								<SelectItem key={name} value={name}>
									<span className="font-mono text-xs">{name}</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : (
					<Input
						className="flex-1 font-mono text-xs"
						value={tool}
						aria-label={m.fastpath_tool()}
						placeholder={m.fastpath_tool_placeholder()}
						onChange={(e) => onChange({ ...intent, tool: e.target.value })}
					/>
				)}
				<span className="text-muted-foreground text-[11px]">
					{m.desc_fast_path_templates({ count: String(templates.length) })}
				</span>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="text-muted-foreground hover:text-destructive h-9 px-2"
					onClick={onRemove}
				>
					<Trash2 className="size-3.5" />
				</Button>
			</div>

			<DescriptorField
				label={m.fastpath_templates()}
				hint={m.fastpath_templates_hint()}
			>
				<ListInput
					multiline
					value={templates}
					rows={3}
					className="font-mono text-xs"
					aria-label={m.fastpath_templates()}
					placeholder={m.fastpath_templates_placeholder()}
					onChange={(next) => onChange({ ...intent, templates: next })}
				/>
			</DescriptorField>

			<KeywordGroups
				groups={intent.requiredKeywords ?? []}
				onChange={(requiredKeywords) =>
					onChange({ ...intent, requiredKeywords })
				}
			/>

			<KeyValueListField
				label={m.fastpath_arg_defaults()}
				addLabel={m.fastpath_arg_defaults_add()}
				rows={argRows.rows}
				onChange={argRows.setRows}
				keyLabel={m.fastpath_arg_key()}
				valuesLabel={m.fastpath_arg_value()}
			/>

			<RoutineSlots slots={slotRows.rows} onChange={slotRows.setRows} />

			<div className="grid gap-3 sm:grid-cols-2">
				<DescriptorField
					label={m.fastpath_priority()}
					hint={m.fastpath_priority_hint()}
				>
					<Input
						type="number"
						value={intent.priority ?? ""}
						onChange={(e) =>
							onChange({ ...intent, priority: parsePriority(e.target.value) })
						}
					/>
				</DescriptorField>
				<div className="space-y-1.5">
					<Label className="text-xs">{m.fastpath_allow_blocked()}</Label>
					<div className="flex items-center gap-2">
						<Switch
							checked={intent.allowBlockedTokens === true}
							onCheckedChange={(checked) =>
								onChange({ ...intent, allowBlockedTokens: checked })
							}
						/>
						<span className="text-muted-foreground text-[11px]">
							{m.fastpath_allow_blocked_hint()}
						</span>
					</div>
				</div>
			</div>
		</div>
	)
}

export function ConfigFastPath({
	scope,
	value,
	options,
	onChange,
}: ConfigFastPathProps) {
	const intents = value?.intents ?? []
	const rules = value?.expansionRules ?? {}
	const emit = (next: Partial<SkillFastPathBlock>) =>
		onChange({ intents, expansionRules: rules, ...next })

	return (
		<div className="space-y-3">
			<div className="flex items-center justify-between gap-2">
				<p className="text-[11px] font-medium">{m.fastpath_scope({ scope })}</p>
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={() => emit({ intents: [...intents, { tool: "" }] })}
				>
					<Plus className="size-3.5" />
					{m.fastpath_intent_add()}
				</Button>
			</div>

			{intents.length === 0 ? (
				<p className="text-muted-foreground rounded-md border border-dashed px-3 py-3 text-center text-[11px]">
					{m.fastpath_intents_empty()}
				</p>
			) : (
				<div className="space-y-3">
					{intents.map((intent, i) => (
						<IntentEditor
							key={i}
							index={i}
							intent={intent}
							options={options}
							onChange={(next) =>
								emit({
									intents: intents.map((it, idx) => (idx === i ? next : it)),
								})
							}
							onRemove={() =>
								emit({ intents: intents.filter((_, idx) => idx !== i) })
							}
						/>
					))}
				</div>
			)}

			<ExpansionRules
				rules={rules}
				onChange={(expansionRules) => emit({ expansionRules })}
			/>
		</div>
	)
}
