import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Pencil, Sparkles, Trash2 } from "lucide-react"
import { toast } from "sonner"
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
import { applyTemplateFn, deleteTemplateFn } from "@/server/templates"
import { cn } from "@/lib/utils"
import type { TemplateCardProps } from "@/types"

export function TemplateCard({ template, targets, onEdit }: TemplateCardProps) {
	const queryClient = useQueryClient()
	const router = useRouter()
	const [targetKey, setTargetKey] = useState(targets[0]?.domiaKey ?? "")
	const c = template.mind.character

	const applyMutation = useMutation({
		mutationFn: () =>
			applyTemplateFn({
				data: { templateId: template.id, domiaKey: targetKey },
			}),
	})

	const deleteMutation = useMutation({
		mutationFn: () => deleteTemplateFn({ data: template.id }),
	})

	const onApply = async () => {
		if (!targetKey) return
		const result = await applyMutation.mutateAsync()
		const target = targets.find((t) => t.domiaKey === targetKey)
		if (result.ok && result.data) {
			toast.success(
				`Applied "${template.name}" to ${target?.name ?? targetKey}`,
				{
					description: "Persona, mood and modules swapped live.",
				},
			)
			queryClient.invalidateQueries({ queryKey: ["fleet"] })
			void router.invalidate()
		} else {
			toast.error("Could not apply", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	}

	const onDelete = async () => {
		const result = await deleteMutation.mutateAsync()
		if (result.ok) {
			toast.success(`Deleted "${template.name}"`)
			queryClient.invalidateQueries({ queryKey: ["templates"] })
		} else {
			toast.error("Could not delete", { description: result.error })
		}
	}

	return (
		<Card className="flex flex-col">
			<CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
				<div className="space-y-1">
					<CardTitle className="text-base">{template.name}</CardTitle>
					<p className="text-muted-foreground text-xs">
						{template.description || "No description"}
					</p>
				</div>
				<div className="flex shrink-0 gap-1">
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Edit"
						onClick={() => onEdit(template)}
					>
						<Pencil className="size-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon-sm"
						aria-label="Delete"
						disabled={deleteMutation.isPending}
						onClick={onDelete}
					>
						<Trash2 className="size-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent className="flex flex-1 flex-col justify-between gap-3">
				<div className="flex flex-wrap gap-1.5">
					<Badge variant="secondary">{c.name}</Badge>
					<Badge variant="outline">{c.personality}</Badge>
					<Badge variant="outline">{c.profession}</Badge>
					<Badge variant="outline">{c.communicationStyle}</Badge>
				</div>
				<div className="flex items-center gap-2">
					<Select value={targetKey} onValueChange={(v) => v && setTargetKey(v)}>
						<SelectTrigger className="h-9 flex-1">
							<SelectValue placeholder="Choose a Domia" />
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
						disabled={!targetKey || applyMutation.isPending}
						onClick={onApply}
					>
						<Sparkles className="size-4" />
						Apply
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
