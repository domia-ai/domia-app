import { Input } from "@/components/ui/input"
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

function ChangedDot({ changed }: { changed: boolean }) {
	if (!changed) return null
	return <span className="bg-primary size-1.5 rounded-full" aria-hidden />
}

function FieldError({ error }: { error?: string | null }) {
	if (!error) return null
	return <p className="text-destructive text-xs">{error}</p>
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
						<p className="text-sm font-medium">{field.label}</p>
						<ChangedDot changed={changed} />
					</div>
					{field.hint && (
						<p className="text-muted-foreground text-xs">{field.hint}</p>
					)}
				</div>
				<Switch checked={Boolean(value)} onCheckedChange={(c) => onChange(c)} />
			</div>
		)
	}

	const label = (
		<FieldLabel className="flex items-center gap-1.5">
			{field.label}
			<ChangedDot changed={changed} />
			{field.unit && (
				<span className="text-muted-foreground text-xs font-normal">
					({field.unit})
				</span>
			)}
		</FieldLabel>
	)

	if (field.kind === "slider") {
		const num = Number(value)
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
				{field.hint && (
					<p className="text-muted-foreground text-xs">{field.hint}</p>
				)}
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
					placeholder={`Add ${field.label.toLowerCase()}…`}
				/>
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
				{field.hint && (
					<p className="text-muted-foreground text-xs">{field.hint}</p>
				)}
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
								{opt}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{field.hint && (
					<p className="text-muted-foreground text-xs">{field.hint}</p>
				)}
			</Field>
		)
	}

	return (
		<Field>
			{label}
			<FieldContent>
				<Input
					type={field.kind === "number" ? "number" : "text"}
					step={field.kind === "number" ? "any" : undefined}
					value={String(value)}
					aria-invalid={error ? true : undefined}
					onChange={(e) =>
						onChange(
							field.kind === "number"
								? e.target.value === ""
									? 0
									: Number(e.target.value)
								: e.target.value,
						)
					}
				/>
			</FieldContent>
			{field.hint && (
				<p className="text-muted-foreground text-xs">{field.hint}</p>
			)}
			<FieldError error={error} />
		</Field>
	)
}
