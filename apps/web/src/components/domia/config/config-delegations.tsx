import { Plus, Share2, Trash2 } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { Skeleton } from "@/components/ui/skeleton"
import { useDataQuery } from "@/hooks/use-query-state"
import { domiaTargetsQueryOptions } from "@/server/fleet"
import { CAPABILITY_META, CAPABILITY_ORDER } from "@/constants/capabilities"
import type {
	CapabilityDelegation,
	ConfigDraftApi,
	DelegationCapability,
} from "@/types/config"
import type { DomiaTarget } from "@/types/fleet"

const DELEGATION_KEYS = new Set<string>([
	"record",
	"stt",
	"llm",
	"tts",
	"playback",
])

const DELEGATION_CAPABILITIES = CAPABILITY_ORDER.filter(
	(key): key is DelegationCapability => DELEGATION_KEYS.has(key),
)

const EMPTY_DELEGATION: CapabilityDelegation = {
	capability: "llm",
	delegateToDomiaKey: "",
	delegateToDomiaId: null,
	priority: 0,
}

function DelegationRow({
	row,
	targets,
	onChange,
	onRemove,
}: {
	row: CapabilityDelegation
	targets: DomiaTarget[]
	onChange: (next: CapabilityDelegation) => void
	onRemove: () => void
}) {
	const known = targets.some((t) => t.domiaKey === row.delegateToDomiaKey)
	return (
		<div className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_6rem_auto] sm:items-end">
			<div className="space-y-1.5">
				<Label className="text-xs">{m.deleg_field_capability()}</Label>
				<Select
					value={row.capability}
					onValueChange={(value) =>
						value &&
						onChange({ ...row, capability: value as DelegationCapability })
					}
					items={DELEGATION_CAPABILITIES.map((key) => ({
						value: key,
						label: CAPABILITY_META[key].label(),
					}))}
				>
					<SelectTrigger className="h-9 w-full">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{DELEGATION_CAPABILITIES.map((key) => (
							<SelectItem key={key} value={key}>
								{CAPABILITY_META[key].label()}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-1.5">
				<Label className="text-xs">{m.deleg_field_target()}</Label>
				<Select
					value={known ? row.delegateToDomiaKey : ""}
					onValueChange={(value) =>
						value &&
						onChange({
							...row,
							delegateToDomiaKey: value,
							delegateToDomiaId:
								value === row.delegateToDomiaKey ? row.delegateToDomiaId : null,
						})
					}
					items={targets.map((t) => ({ value: t.domiaKey, label: t.name }))}
				>
					<SelectTrigger className="h-9 w-full">
						<SelectValue placeholder={m.deleg_target_placeholder()} />
					</SelectTrigger>
					<SelectContent>
						{targets.map((t) => (
							<SelectItem key={t.domiaKey} value={t.domiaKey}>
								{t.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				{!known && row.delegateToDomiaKey && (
					<p className="text-muted-foreground font-mono text-[11px]">
						{m.deleg_target_unknown({ key: row.delegateToDomiaKey })}
					</p>
				)}
			</div>

			<div className="space-y-1.5">
				<Label className="text-xs">{m.deleg_field_priority()}</Label>
				<Input
					type="number"
					min={0}
					step={1}
					className="h-9"
					value={String(row.priority)}
					onChange={(e) =>
						onChange({
							...row,
							priority: Number.parseInt(e.target.value, 10) || 0,
						})
					}
				/>
			</div>

			<Button
				type="button"
				variant="ghost"
				size="icon"
				className="text-muted-foreground hover:text-destructive"
				onClick={onRemove}
			>
				<Trash2 className="size-4" />
			</Button>
		</div>
	)
}

export function ConfigDelegations({
	draft,
	domiaKey,
}: {
	draft: ConfigDraftApi
	domiaKey: string
}) {
	const { state } = useDataQuery<DomiaTarget[], string[]>({
		...domiaTargetsQueryOptions(),
		errorMessage: m.deleg_targets_error,
	})

	const rows = draft.delegations
	const setRows = draft.setDelegations

	const update = (index: number, next: CapabilityDelegation) =>
		setRows(rows.map((row, i) => (i === index ? next : row)))

	const remove = (index: number) => setRows(rows.filter((_, i) => i !== index))

	return (
		<div className="space-y-3 border-t pt-4">
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<Share2 className="text-muted-foreground size-4" />
					<h3 className="text-sm font-semibold">{m.deleg_title()}</h3>
				</div>
				<p className="text-muted-foreground text-xs">{m.deleg_hint()}</p>
			</div>

			<AsyncBoundary
				state={state}
				skeleton={<Skeleton className="h-20 w-full" />}
			>
				{(all) => {
					const targets = all.filter((t) => t.domiaKey !== domiaKey)
					return (
						<div className="space-y-3">
							{rows.length === 0 && (
								<p className="text-muted-foreground rounded-lg border border-dashed px-3 py-4 text-center text-sm">
									{m.deleg_empty()}
								</p>
							)}
							{rows.map((row, index) => (
								<DelegationRow
									key={`${row.capability}-${index}`}
									row={row}
									targets={targets}
									onChange={(next) => update(index, next)}
									onRemove={() => remove(index)}
								/>
							))}
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={targets.length === 0}
								onClick={() => setRows([...rows, { ...EMPTY_DELEGATION }])}
							>
								<Plus className="size-4" />
								{m.deleg_add()}
							</Button>
							{targets.length === 0 && (
								<p className="text-muted-foreground text-xs">
									{m.deleg_no_targets()}
								</p>
							)}
						</div>
					)
				}}
			</AsyncBoundary>
		</div>
	)
}
