import { Plus, Trash2 } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ListInput } from "@/components/ui/list-input"
import { DuplicateKeyIssue } from "@/components/domia/config/descriptor-fields"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { FAST_PATH_SLOT_KINDS } from "@/constants/routines"
import type { JsonValue } from "@/types/config"
import type {
	FastPathSlot,
	FastPathSlotKind,
	FastPathSlotSource,
	MapValuesProps,
	RoutineSlotsProps,
	SourceFieldsProps,
} from "@/types/routines"

const KIND_LABELS: Record<FastPathSlotKind, () => string> = {
	enum: m.routine_slot_kind_enum,
	map: m.routine_slot_kind_map,
	schemaEnum: m.routine_slot_kind_schema_enum,
	range: m.routine_slot_kind_range,
	duration: m.routine_slot_kind_duration,
	clockTime: m.routine_slot_kind_clock_time,
	context: m.routine_slot_kind_context,
}

const EMPTY_SOURCE: Record<FastPathSlotKind, FastPathSlotSource> = {
	enum: { kind: "enum", values: [] },
	map: { kind: "map", values: [] },
	schemaEnum: { kind: "schemaEnum", arg: "" },
	range: { kind: "range", min: 0, max: 100 },
	duration: { kind: "duration" },
	clockTime: { kind: "clockTime" },
	context: { kind: "context", key: "" },
}

const parseOut = (raw: string): JsonValue => {
	const text = raw.trim()
	if (text === "") return ""
	try {
		return JSON.parse(text) as JsonValue
	} catch {
		return text
	}
}

const outText = (out: JsonValue): string =>
	typeof out === "string" ? out : JSON.stringify(out)

function MapValues({ values, onChange }: MapValuesProps) {
	return (
		<div className="space-y-2">
			{values.map((entry, i) => (
				<div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
					<ListInput
						value={entry.in}
						aria-label={m.routine_slot_map_in()}
						placeholder={m.routine_slot_map_in()}
						onChange={(next) =>
							onChange(
								values.map((v, idx) => (idx === i ? { ...v, in: next } : v)),
							)
						}
					/>
					<Input
						value={outText(entry.out)}
						aria-label={m.routine_slot_map_out()}
						placeholder={m.routine_slot_map_out()}
						onChange={(e) =>
							onChange(
								values.map((v, idx) =>
									idx === i ? { ...v, out: parseOut(e.target.value) } : v,
								),
							)
						}
					/>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="text-muted-foreground hover:text-destructive h-9 px-2"
						onClick={() => onChange(values.filter((_, idx) => idx !== i))}
					>
						<Trash2 className="size-3.5" />
					</Button>
				</div>
			))}
			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() => onChange([...values, { in: [], out: "" }])}
			>
				<Plus className="size-3.5" />
				{m.routine_slot_map_add()}
			</Button>
		</div>
	)
}

function SourceFields({ source, onChange }: SourceFieldsProps) {
	if (source.kind === "enum")
		return (
			<div className="space-y-1.5">
				<Label className="text-xs">{m.routine_slot_values()}</Label>
				<ListInput
					value={source.values}
					aria-label={m.routine_slot_values()}
					placeholder={m.routine_slot_values_placeholder()}
					onChange={(values) => onChange({ kind: "enum", values })}
				/>
			</div>
		)
	if (source.kind === "map")
		return (
			<div className="space-y-1.5">
				<Label className="text-xs">{m.routine_slot_map()}</Label>
				<MapValues
					values={source.values}
					onChange={(values) => onChange({ kind: "map", values })}
				/>
			</div>
		)
	if (source.kind === "schemaEnum")
		return (
			<div className="space-y-1.5">
				<Label className="text-xs">{m.routine_slot_schema_arg()}</Label>
				<Input
					value={source.arg}
					placeholder={m.routine_slot_schema_arg_placeholder()}
					onChange={(e) =>
						onChange({ kind: "schemaEnum", arg: e.target.value })
					}
				/>
			</div>
		)
	if (source.kind === "range")
		return (
			<div className="grid grid-cols-2 gap-2">
				<div className="space-y-1.5">
					<Label className="text-xs">{m.routine_slot_min()}</Label>
					<Input
						type="number"
						value={source.min}
						onChange={(e) =>
							onChange({
								kind: "range",
								min: Number(e.target.value) || 0,
								max: source.max,
							})
						}
					/>
				</div>
				<div className="space-y-1.5">
					<Label className="text-xs">{m.routine_slot_max()}</Label>
					<Input
						type="number"
						value={source.max}
						onChange={(e) =>
							onChange({
								kind: "range",
								min: source.min,
								max: Number(e.target.value) || 0,
							})
						}
					/>
				</div>
			</div>
		)
	if (source.kind === "duration")
		return (
			<div className="space-y-1.5">
				<Label className="text-xs">{m.routine_slot_max_seconds()}</Label>
				<Input
					type="number"
					value={source.maxSeconds ?? ""}
					placeholder={m.routine_slot_max_seconds_placeholder()}
					onChange={(e) =>
						onChange({
							kind: "duration",
							maxSeconds: Number(e.target.value) || undefined,
						})
					}
				/>
			</div>
		)
	if (source.kind === "context")
		return (
			<div className="space-y-1.5">
				<Label className="text-xs">{m.routine_slot_context_key()}</Label>
				<Input
					value={source.key}
					placeholder={m.routine_slot_context_key_placeholder()}
					onChange={(e) => onChange({ kind: "context", key: e.target.value })}
				/>
			</div>
		)
	return (
		<p className="text-muted-foreground text-[11px]">
			{m.routine_slot_clock_note()}
		</p>
	)
}

export function RoutineSlots({ slots, onChange }: RoutineSlotsProps) {
	const patch = (i: number, slot: FastPathSlot) =>
		onChange(slots.map((row, idx) => (idx === i ? [row[0], slot] : row)))

	return (
		<section className="space-y-3">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold">{m.routine_slots_title()}</h3>
				<p className="text-muted-foreground text-xs">
					{m.routine_slots_desc()}
				</p>
			</div>

			{slots.length === 0 ? (
				<p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-4 text-center text-xs">
					{m.routine_slots_empty()}
				</p>
			) : null}

			<div className="space-y-3">
				{slots.map(([name, slot], i) => (
					<div
						key={i}
						className="border-border space-y-3 rounded-lg border p-3"
					>
						<div className="grid grid-cols-[1fr_1fr_10rem_auto] gap-2">
							<Input
								value={name}
								aria-label={m.routine_slot_name()}
								placeholder={m.routine_slot_name()}
								onChange={(e) =>
									onChange(
										slots.map((row, idx) =>
											idx === i ? [e.target.value, row[1]] : row,
										),
									)
								}
							/>
							<Input
								value={slot.arg ?? ""}
								aria-label={m.routine_slot_arg()}
								placeholder={m.routine_slot_arg_placeholder()}
								onChange={(e) =>
									patch(i, { ...slot, arg: e.target.value || undefined })
								}
							/>
							<Select
								value={slot.source.kind}
								onValueChange={(v) =>
									patch(i, {
										...slot,
										source: EMPTY_SOURCE[v as FastPathSlotKind],
									})
								}
							>
								<SelectTrigger aria-label={m.routine_slot_kind()}>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{FAST_PATH_SLOT_KINDS.map((kind) => (
										<SelectItem key={kind} value={kind}>
											{KIND_LABELS[kind]()}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								className="text-muted-foreground hover:text-destructive h-9 px-2"
								onClick={() => onChange(slots.filter((_, idx) => idx !== i))}
							>
								<Trash2 className="size-3.5" />
							</Button>
						</div>
						<SourceFields
							source={slot.source}
							onChange={(source) => patch(i, { ...slot, source })}
						/>
					</div>
				))}
			</div>

			<DuplicateKeyIssue rows={slots} />

			<Button
				type="button"
				variant="outline"
				size="sm"
				onClick={() =>
					onChange([...slots, ["", { source: { kind: "enum", values: [] } }]])
				}
			>
				<Plus className="size-3.5" />
				{m.routine_slots_add()}
			</Button>
		</section>
	)
}
