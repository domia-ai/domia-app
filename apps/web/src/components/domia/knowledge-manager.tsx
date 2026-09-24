import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { BookOpen, Loader2, Plus, Trash2, Pencil, X } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useActionQuery } from "@/hooks/use-query-state"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
	knowledgeQueryOptions,
	saveKnowledgeFn,
	deleteKnowledgeFn,
} from "@/server/knowledge"
import type { KnowledgeManagerProps } from "@/types/domia"
import type { KnowledgeDraft, KnowledgeEntry } from "@/types/knowledge"

const EMPTY: KnowledgeDraft = {
	title: "",
	content: "",
	priority: 0,
	isActive: true,
}

export function KnowledgeManager({
	domiaKey,
	online,
	maxChars,
}: KnowledgeManagerProps) {
	const qc = useQueryClient()
	const { state } = useActionQuery({
		...knowledgeQueryOptions(domiaKey),
		errorMessage: m.err_request_failed,
	})
	const [draft, setDraft] = useState<KnowledgeDraft | null>(null)

	const invalidate = () =>
		qc.invalidateQueries({ queryKey: ["knowledge", domiaKey] })

	const save = useActionMutation({
		mutationFn: (d: KnowledgeDraft) =>
			saveKnowledgeFn({
				data: {
					domiaKey,
					entry: {
						id: d.id,
						title: d.title,
						content: d.content,
						priority: d.priority,
						isActive: d.isActive,
					},
				},
			}),
		failureTitle: m.err_save_entry,
		onDone: () => {
			toast.success(m.toast_knowledge_saved())
			setDraft(null)
			void invalidate()
		},
	})

	const remove = useActionMutation({
		mutationFn: (id: string) => deleteKnowledgeFn({ data: { domiaKey, id } }),
		failureTitle: m.err_delete_entry,
		onDone: () => {
			toast.success(m.toast_entry_deleted())
			void invalidate()
		},
	})

	const toDraft = (e: KnowledgeEntry): KnowledgeDraft => ({
		id: e.id,
		title: e.title,
		content: e.content,
		priority: e.priority,
		isActive: e.isActive,
	})

	const overLimit =
		maxChars !== undefined && (draft?.content.length ?? 0) > maxChars

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between">
				<div className="space-y-1">
					<h2 className="flex items-center gap-2 text-lg font-semibold">
						<BookOpen className="size-4" /> {m.domia_kb_title()}
					</h2>
					<p className="text-muted-foreground text-sm">{m.domia_kb_desc()}</p>
				</div>
				<Button
					size="sm"
					disabled={!online || !!draft}
					onClick={() => setDraft({ ...EMPTY })}
				>
					<Plus className="size-4" /> {m.domia_kb_add()}
				</Button>
			</div>

			{draft ? (
				<div className="border-border space-y-3 rounded-lg border p-4">
					<div className="space-y-1.5">
						<Label htmlFor="kb-title">{m.domia_kb_field_title()}</Label>
						<Input
							id="kb-title"
							value={draft.title}
							placeholder={m.domia_kb_title_placeholder()}
							onChange={(e) => setDraft({ ...draft, title: e.target.value })}
						/>
					</div>
					<div className="space-y-1.5">
						<Label htmlFor="kb-content">{m.domia_kb_field_content()}</Label>
						<Textarea
							id="kb-content"
							value={draft.content}
							rows={3}
							placeholder={m.domia_kb_content_placeholder()}
							onChange={(e) => setDraft({ ...draft, content: e.target.value })}
						/>
						<div className="flex items-center justify-between gap-2">
							{overLimit && maxChars !== undefined ? (
								<p className="text-destructive text-xs">
									{m.err_max_length({ max: maxChars })}
								</p>
							) : (
								<span />
							)}
							<span
								className={cn(
									"font-mono text-[11px] tabular-nums",
									overLimit ? "text-destructive" : "text-muted-foreground",
								)}
							>
								{maxChars === undefined
									? draft.content.length
									: `${draft.content.length} / ${maxChars}`}
							</span>
						</div>
					</div>
					<div className="flex items-center gap-6">
						<div className="flex items-center gap-2">
							<Label htmlFor="kb-priority" className="text-sm">
								{m.domia_kb_field_priority()}
							</Label>
							<Input
								id="kb-priority"
								type="number"
								className="w-20"
								value={draft.priority}
								onChange={(e) =>
									setDraft({ ...draft, priority: Number(e.target.value) || 0 })
								}
							/>
						</div>
						<div className="flex items-center gap-2">
							<Switch
								checked={draft.isActive}
								onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
							/>
							<span className="text-sm">{m.domia_kb_active()}</span>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button variant="ghost" size="sm" onClick={() => setDraft(null)}>
							<X className="size-4" /> {m.domia_kb_cancel()}
						</Button>
						<Button
							size="sm"
							disabled={
								!draft.title.trim() ||
								!draft.content.trim() ||
								overLimit ||
								save.isPending
							}
							onClick={() => save.mutate(draft)}
						>
							{save.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : null}
							{m.domia_kb_save()}
						</Button>
					</div>
				</div>
			) : null}

			<AsyncBoundary
				state={state}
				skeleton={
					<div className="text-muted-foreground flex items-center gap-2 py-8 text-sm">
						<Loader2 className="size-4 animate-spin" /> {m.domia_kb_loading()}
					</div>
				}
			>
				{(entries) =>
					!entries || entries.length === 0 ? (
						draft ? null : (
							<p className="text-muted-foreground border-border rounded-lg border border-dashed py-8 text-center text-sm">
								{m.domia_kb_empty()}
							</p>
						)
					) : (
						<ul className="space-y-2">
							{entries.map((e) => (
								<li
									key={e.id}
									className="border-border flex items-start justify-between gap-3 rounded-lg border px-3 py-2.5"
								>
									<div className="min-w-0">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium">{e.title}</span>
											{!e.isActive ? (
												<span className="text-muted-foreground text-[11px]">
													{m.domia_kb_inactive()}
												</span>
											) : null}
										</div>
										<p className="text-muted-foreground truncate text-sm">
											{e.content}
										</p>
									</div>
									<div className="flex shrink-0 items-center gap-1">
										<Button
											variant="ghost"
											size="icon"
											disabled={!online}
											onClick={() => setDraft(toDraft(e))}
										>
											<Pencil className="size-3.5" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											disabled={!online || remove.isPending}
											onClick={() => remove.mutate(e.id)}
										>
											<Trash2 className="text-destructive size-3.5" />
										</Button>
									</div>
								</li>
							))}
						</ul>
					)
				}
			</AsyncBoundary>
		</div>
	)
}
