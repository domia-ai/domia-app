import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { ListOrdered, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useActionQuery } from "@/hooks/use-query-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { RoutineEditor } from "@/components/routines/routine-editor"
import {
	deleteRoutineFn,
	routinesQueryOptions,
	saveRoutineFn,
} from "@/server/routines"
import { ROUTINE_TOOL_PREFIX } from "@/constants/routines"
import { argRowsOf, argsFromRows } from "@/utils/scalar"
import type {
	FastPathSlot,
	Routine,
	RoutineDraft,
	RoutineInput,
	RoutinesManagerProps,
} from "@/types/routines"

const EMPTY_DRAFT: RoutineDraft = {
	slug: "",
	name: "",
	description: "",
	isActive: true,
	phrases: {},
	reply: {},
	slots: [],
	steps: [{ tool: "", args: [] }],
}

const toDraft = (routine: Routine): RoutineDraft => ({
	id: routine.id,
	slug: routine.slug,
	name: routine.name,
	description: routine.description,
	isActive: routine.isActive,
	phrases: routine.phrases,
	reply: routine.reply,
	slots: Object.entries(routine.slots ?? {}),
	steps: routine.steps.map((step) => ({
		tool: step.tool,
		args: argRowsOf(step.args),
	})),
})

const cleanSlots = (
	rows: [string, FastPathSlot][],
): Record<string, FastPathSlot> | null => {
	const entries = rows
		.filter(([name]) => name.trim())
		.map(([name, slot]): [string, FastPathSlot] => [
			name.trim(),
			slot.arg?.trim()
				? { source: slot.source, arg: slot.arg.trim() }
				: { source: slot.source },
		])
	return entries.length > 0 ? Object.fromEntries(entries) : null
}

const toInput = (draft: RoutineDraft): RoutineInput => ({
	...(draft.id ? { id: draft.id } : {}),
	slug: draft.slug,
	name: draft.name.trim(),
	description: draft.description.trim(),
	isActive: draft.isActive,
	phrases: Object.fromEntries(
		Object.entries(draft.phrases)
			.map(([locale, lines]): [string, string[]] => [
				locale,
				lines.map((line) => line.trim()).filter(Boolean),
			])
			.filter(([, lines]) => lines.length > 0),
	),
	reply: Object.fromEntries(
		Object.entries(draft.reply)
			.map(([locale, text]): [string, string] => [locale, text.trim()])
			.filter(([, text]) => text.length > 0),
	),
	slots: cleanSlots(draft.slots),
	steps: draft.steps.map((step) => ({
		tool: step.tool.trim(),
		args: argsFromRows(step.args),
	})),
})

export function RoutinesManager({ domiaKey, online }: RoutinesManagerProps) {
	const qc = useQueryClient()
	const { state } = useActionQuery(routinesQueryOptions(domiaKey))
	const [draft, setDraft] = useState<RoutineDraft | null>(null)
	const [pendingDelete, setPendingDelete] = useState<Routine | null>(null)

	const invalidate = async () => {
		await qc.invalidateQueries({ queryKey: ["routines", domiaKey] })
		await qc.invalidateQueries({ queryKey: ["skills-status", domiaKey] })
	}

	const save = useActionMutation({
		mutationFn: (d: RoutineDraft) =>
			saveRoutineFn({ data: { domiaKey, routine: toInput(d) } }),
		failureTitle: m.routine_toast_save_failed,
		onDone: (saved) => {
			toast.success(
				saved?.created
					? m.routine_toast_created({
							tool: `${ROUTINE_TOOL_PREFIX}${saved.routine.slug}`,
						})
					: m.routine_toast_updated({
							tool: `${ROUTINE_TOOL_PREFIX}${saved?.routine.slug ?? ""}`,
						}),
			)
			setDraft(null)
			void invalidate()
		},
	})

	const remove = useActionMutation({
		mutationFn: (id: string) => deleteRoutineFn({ data: { domiaKey, id } }),
		failureTitle: m.routine_toast_delete_failed,
		onDone: () => {
			toast.success(m.routine_toast_deleted())
			setPendingDelete(null)
			void invalidate()
		},
	})

	const routines = state.status === "ready" ? (state.data ?? []) : []
	const loadError = state.status === "error" ? state.message : null

	return (
		<div className="space-y-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="space-y-1">
					<h2 className="flex items-center gap-2 text-lg font-semibold">
						<ListOrdered className="size-4" /> {m.routine_list_title()}
					</h2>
					<p className="text-muted-foreground text-sm">
						{m.routine_list_desc()}
					</p>
				</div>
				<Button
					size="sm"
					disabled={!online || !!draft}
					onClick={() => setDraft({ ...EMPTY_DRAFT })}
				>
					<Plus className="size-4" /> {m.routine_new()}
				</Button>
			</div>

			{draft ? (
				<RoutineEditor
					domiaKey={domiaKey}
					draft={draft}
					online={online}
					saving={save.isPending}
					onChange={setDraft}
					onSave={() => save.mutate(draft)}
					onCancel={() => setDraft(null)}
				/>
			) : null}

			{state.status === "loading" ? (
				<div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
					<Loader2 className="size-4 animate-spin" /> {m.routine_loading()}
				</div>
			) : loadError ? (
				<p className="text-destructive py-6 text-sm">
					{m.routine_load_error({ error: loadError })}
				</p>
			) : routines.length === 0 ? (
				<p className="text-muted-foreground border-border rounded-lg border border-dashed py-8 text-center text-sm">
					{m.routine_empty()}
				</p>
			) : (
				<ul className="space-y-2">
					{routines.map((routine) => (
						<li
							key={routine.id}
							className="border-border flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
						>
							<div className="min-w-0 space-y-1">
								<div className="flex flex-wrap items-center gap-2">
									<span className="text-sm font-medium">{routine.name}</span>
									<Badge variant="outline" className="font-mono text-[11px]">
										{`${ROUTINE_TOOL_PREFIX}${routine.slug}`}
									</Badge>
									{!routine.isActive ? (
										<span className="text-muted-foreground text-[11px]">
											{m.routine_inactive()}
										</span>
									) : null}
								</div>
								<p className="text-muted-foreground truncate text-sm">
									{routine.description}
								</p>
								<p className="text-muted-foreground text-[11px]">
									{m.routine_meta({
										steps: routine.steps.length,
										phrases: Object.values(routine.phrases).reduce(
											(sum, lines) => sum + lines.length,
											0,
										),
										languages: Object.keys(routine.phrases).join(", "),
									})}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-1">
								<Button
									variant="ghost"
									size="icon"
									disabled={!online || !!draft}
									onClick={() => setDraft(toDraft(routine))}
								>
									<Pencil className="size-3.5" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									disabled={!online || remove.isPending}
									onClick={() => setPendingDelete(routine)}
								>
									<Trash2 className="text-destructive size-3.5" />
								</Button>
							</div>
						</li>
					))}
				</ul>
			)}

			<Dialog
				open={pendingDelete !== null}
				onOpenChange={(next) => {
					if (!next) setPendingDelete(null)
				}}
			>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{m.routine_delete_title()}</DialogTitle>
						<DialogDescription>
							{m.routine_delete_desc({
								name: pendingDelete?.name ?? "",
								tool: `${ROUTINE_TOOL_PREFIX}${pendingDelete?.slug ?? ""}`,
							})}
						</DialogDescription>
					</DialogHeader>
					<DialogFooter className="mt-4">
						<DialogClose
							render={
								<Button type="button" variant="outline">
									{m.dlg_cancel()}
								</Button>
							}
						/>
						<Button
							type="button"
							variant="destructive"
							disabled={!online || !pendingDelete || remove.isPending}
							onClick={() => {
								if (pendingDelete) remove.mutate(pendingDelete.id)
							}}
						>
							{remove.isPending
								? m.routine_deleting()
								: m.routine_delete_confirm()}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
