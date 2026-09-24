import { Plus, Trash2 } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ListInput } from "@/components/ui/list-input"
import { useKeyedRows } from "@/components/ui/keyed-rows"
import { duplicateKeys } from "@/utils/scalar"
import type {
	DescriptorFieldProps,
	DuplicateKeyIssueProps,
	KeyValueListFieldProps,
	KeyValueMapFieldProps,
} from "@/types/config"

export function DescriptorField({
	label,
	hint,
	children,
}: DescriptorFieldProps) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs">{label}</Label>
			{children}
			{hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
		</div>
	)
}

export function DuplicateKeyIssue({ rows }: DuplicateKeyIssueProps) {
	const dupes = duplicateKeys(rows)
	if (dupes.size === 0) return null
	return (
		<p className="text-destructive text-[11px]">
			{m.desc_issue_duplicate_key({ keys: [...dupes].join(", ") })}
		</p>
	)
}

export function KeyValueListField({
	label,
	addLabel,
	rows,
	onChange,
	keyLabel,
	valuesLabel,
	keyPlaceholder,
}: KeyValueListFieldProps) {
	const dupes = duplicateKeys(rows)
	const setKey = (i: number, key: string) =>
		onChange(rows.map((r, idx) => (idx === i ? [key, r[1]] : r)))
	const setVals = (i: number, vals: string[]) =>
		onChange(rows.map((r, idx) => (idx === i ? [r[0], vals] : r)))
	const remove = (i: number) => onChange(rows.filter((_, idx) => idx !== i))
	const add = () => onChange([...rows, ["", []]])

	return (
		<DescriptorField label={label}>
			<div className="space-y-2">
				{rows.map(([key, vals], i) => (
					<div key={i} className="grid grid-cols-[10rem_1fr_auto] gap-2">
						<Input
							value={key}
							onChange={(e) => setKey(i, e.target.value)}
							placeholder={keyPlaceholder ?? keyLabel}
							aria-label={keyLabel}
							aria-invalid={dupes.has(key.trim()) || undefined}
						/>
						<ListInput
							value={vals}
							onChange={(next) => setVals(i, next)}
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
				<DuplicateKeyIssue rows={rows} />
				<Button type="button" variant="outline" size="sm" onClick={add}>
					<Plus className="size-3.5" />
					{addLabel}
				</Button>
			</div>
		</DescriptorField>
	)
}

export function KeyValueMapField({
	value,
	onChange,
	...rest
}: KeyValueMapFieldProps) {
	const { rows, setRows } = useKeyedRows(value, onChange)
	return <KeyValueListField {...rest} rows={rows} onChange={setRows} />
}
