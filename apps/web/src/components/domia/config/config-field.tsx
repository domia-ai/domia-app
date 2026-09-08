import { m } from "@/paraglide/messages"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { TagEditor } from "../tag-editor"
import { ModelPicker } from "./model-picker"
import { cn } from "@/lib/utils"
import type { ConfigField, FieldValue } from "@/types/config"

const UNIT_LABELS: Record<string, () => string> = {
	chars: m.config_unit_chars,
	words: m.config_unit_words,
	sentences: m.config_unit_sentences,
	tokens: m.config_unit_tokens,
	turns: m.config_unit_turns,
	ms: m.config_unit_ms,
	s: m.config_unit_s,
	Hz: m.config_unit_hz,
}

const unitLabel = (unit: string): string => UNIT_LABELS[unit]?.() ?? unit

function ChangedDot({ changed }: { changed: boolean }) {
	if (!changed) return null
	return <span className="bg-primary size-1.5 rounded-full" aria-hidden />
}

function FieldError({ error }: { error?: string | null }) {
	if (!error) return null
	return <p className="text-destructive text-xs">{error}</p>
}

function Hint({ field }: { field: ConfigField }) {
	if (!field.hint) return null
	return <p className="text-muted-foreground text-xs">{field.hint()}</p>
}

export function ConfigFieldRow({
	field,
	value,
	changed,
	domiaKey,
	error,
	onChange,
}: {
	field: ConfigField
	value: FieldValue
	changed: boolean
	domiaKey: string
	error?: string | null
	onChange: (value: FieldValue) => void
}) {
	if (field.kind === "boolean") {
		return (
			<div
				className={cn(
					"flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5",
					changed && "border-primary/40 bg-primary/5",
				)}
			>
				<div className="space-y-0.5">
					<div className="flex items-center gap-1.5">
						<p className="text-sm font-medium">{field.label()}</p>
						<ChangedDot changed={changed} />
					</div>
					<Hint field={field} />
				</div>
				<Switch checked={Boolean(value)} onCheckedChange={(c) => onChange(c)} />
			</div>
		)
	}

	const label = (
		<FieldLabel className="flex items-center gap-1.5">
			{field.label()}
			<ChangedDot changed={changed} />
			{field.unit && (
				<span className="text-muted-foreground text-xs font-normal">
					({unitLabel(field.unit)})
				</span>
			)}
		</FieldLabel>
	)

	if (field.kind === "slider") {
		const num = value === "" ? Number(field.default ?? 0) : Number(value)
		return (
			<Field>
				<div className="flex items-center justify-between">
					{label}
					<span className="text-muted-foreground font-mono text-xs tabular-nums">
						{num.toFixed(2)}
						{field.unit === "×" ? "×" : ""}
					</span>
				</div>
				<Slider
					min={field.min ?? 0}
					max={field.max ?? 1}
					step={field.step ?? 0.05}
					value={[num]}
					onValueChange={(v) => onChange(Array.isArray(v) ? v[0] : v)}
				/>
				<Hint field={field} />
				<FieldError error={error} />
			</Field>
		)
	}

	if (field.kind === "tags") {
		return (
			<Field>
				{label}
				<TagEditor
					values={Array.isArray(value) ? value : []}
					onChange={(next) => onChange(next)}
					placeholder={m.config_add_tag({ label: field.label().toLowerCase() })}
				/>
				<Hint field={field} />
			</Field>
		)
	}

	if (field.kind === "model") {
		return (
			<Field>
				{label}
				<ModelPicker
					domiaKey={domiaKey}
					stage={field.stage ?? ""}
					value={String(value)}
					onChange={(v) => onChange(v)}
				/>
				<Hint field={field} />
			</Field>
		)
	}

	if (field.kind === "select") {
		return (
			<Field>
				{label}
				<Select value={String(value)} onValueChange={(v) => v && onChange(v)}>
					<SelectTrigger className="h-9">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{(field.options ?? []).map((opt) => (
							<SelectItem key={opt} value={opt}>
								{field.optionLabels?.[opt]?.() ?? opt}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Hint field={field} />
			</Field>
		)
	}

	if (field.kind === "json") {
		return (
			<Field>
				{label}
				<Textarea
					value={String(value)}
					rows={4}
					className="font-mono text-xs"
					spellCheck={false}
					readOnly={field.readOnly}
					aria-invalid={error ? true : undefined}
					placeholder={field.nullable ? "null" : "{}"}
					onChange={
						field.readOnly ? undefined : (e) => onChange(e.target.value)
					}
				/>
				<Hint field={field} />
				<FieldError error={error} />
			</Field>
		)
	}

	if (field.kind === "secret") {
		return (
			<Field>
				{label}
				<FieldContent>
					<Input
						type="password"
						autoComplete="off"
						value={String(value)}
						placeholder={m.config_secret_placeholder()}
						onChange={(e) => onChange(e.target.value)}
					/>
				</FieldContent>
				<p className="text-muted-foreground text-xs">
					{field.hint ? `${field.hint()} ` : ""}
					{m.config_secret_hint()}
				</p>
			</Field>
		)
	}

	const isNumber = field.kind === "number"
	return (
		<Field>
			{label}
			<FieldContent>
				<Input
					type={isNumber ? "number" : "text"}
					step={isNumber ? "any" : undefined}
					value={String(value)}
					aria-invalid={error ? true : undefined}
					placeholder={isNumber && field.nullable ? "—" : undefined}
					onChange={(e) =>
						onChange(
							isNumber
								? e.target.value === ""
									? field.nullable
										? ""
										: 0
									: Number(e.target.value)
								: e.target.value,
						)
					}
				/>
			</FieldContent>
			<Hint field={field} />
			<FieldError error={error} />
		</Field>
	)
}
