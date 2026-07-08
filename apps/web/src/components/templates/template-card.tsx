import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Link, useRouter } from "@tanstack/react-router"
import { Pencil, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { applyConfigTemplateFn, deleteTemplateFn } from "@/server/templates"
import { isDemoMode } from "@/lib/demo"
import { cn } from "@/lib/utils"
import type { TemplateCardProps } from "@/types"

const str = (v: unknown): string | null =>
	v == null || v === "" ? null : String(v)

export function TemplateCard({ template, targets }: TemplateCardProps) {
	const queryClient = useQueryClient()
	const router = useRouter()
	const [targetKey, setTargetKey] = useState(targets[0]?.domiaKey ?? "")

	const applyMutation = useMutation({
		mutationFn: () =>
			applyConfigTemplateFn({
				data: { templateId: template.id, domiaKey: targetKey },
			}),
	})

	const deleteMutation = useMutation({
		mutationFn: () => deleteTemplateFn({ data: template.id }),
	})

	const onApply = async () => {
		if (!targetKey) return
		const target = targets.find((t) => t.domiaKey === targetKey)
		const name = target?.name ?? targetKey
		const result = await applyMutation.mutateAsync()
		if (result.ok && result.data) {
			toast.success(
				m.toast_template_applied({ template: template.name, name }),
				{
					description: m.toast_template_applied_desc({ name }),
				},
			)
			queryClient.invalidateQueries({ queryKey: ["fleet"] })
			void router.invalidate()
		} else {
			toast.error(m.toast_template_apply_failed(), {
				description: errText(result.ok ? undefined : result.error),
			})
		}
	}

	const onDelete = async () => {
		const result = await deleteMutation.mutateAsync()
		if (result.ok) {
			toast.success(m.toast_template_deleted({ name: template.name }))
			queryClient.invalidateQueries({ queryKey: ["templates"] })
		} else {
			toast.error(m.toast_template_delete_failed(), {
				description: errText(result.error),
			})
		}
	}

	const badges = [
		str(template.config?.character?.name),
		str(template.config?.llm?.modelName),
		str(template.config?.tts?.voiceName),
	].filter(Boolean)

	return (
		<Card className="flex flex-col">
			<CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
				<div className="space-y-1">
					<div className="flex items-center gap-2">
						<CardTitle className="text-base">{template.name}</CardTitle>
						{template.isSystem && (
							<Badge variant="secondary" className="text-[10px]">
								{m.templates_system_badge()}
							</Badge>
						)}
					</div>
					<p className="text-muted-foreground text-xs">
						{template.description || m.templates_no_description()}
					</p>
				</div>
				{!template.isSystem && (
					<div className="flex shrink-0 gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={m.aria_edit()}
							nativeButton={false}
							render={
								<Link to="/templates/$id/edit" params={{ id: template.id }} />
							}
						>
							<Pencil className="size-4" />
						</Button>
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label={m.aria_delete()}
							disabled={deleteMutation.isPending || isDemoMode()}
							onClick={onDelete}
						>
							<Trash2 className="size-4" />
						</Button>
					</div>
				)}
			</CardHeader>
			<CardContent className="flex flex-1 flex-col justify-between gap-3">
				{badges.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{badges.map((b, i) => (
							<Badge key={b} variant={i === 0 ? "secondary" : "outline"}>
								{b}
							</Badge>
						))}
					</div>
				)}
				<div className="flex items-center gap-2">
					<Select
						value={targetKey}
						onValueChange={(v) => v && setTargetKey(v)}
						items={targets.map((t) => ({ value: t.domiaKey, label: t.name }))}
					>
						<SelectTrigger className="h-9 flex-1">
							<SelectValue placeholder={m.templates_choose_domia()} />
						</SelectTrigger>
						<SelectContent>
							{targets.map((t) => (
								<SelectItem key={t.domiaKey} value={t.domiaKey}>
									<span className="flex items-center gap-2">
										<span
											className={cn(
												"size-1.5 rounded-full",
												t.online ? "bg-emerald-500" : "bg-muted-foreground/40",
											)}
										/>
										{t.name}
									</span>
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<Button
						size="sm"
						disabled={!targetKey || applyMutation.isPending || isDemoMode()}
						onClick={onApply}
					>
						<Sparkles className="size-4" />
						{m.templates_apply()}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
