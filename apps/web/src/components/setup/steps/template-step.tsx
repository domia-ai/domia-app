import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, Layers, Loader2, Lock } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { summarizeApply } from "@/lib/config-apply"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
	applyConfigTemplateFn,
	templatesQueryOptions,
} from "@/server/templates"
import { isDemoMode } from "@/lib/demo"
import { StepShell, ContinueButton } from "./step-shell"
import type { SetupStepProps } from "@/types/setup-ui"

export function TemplateStep({
	domiaKey,
	domiaName,
	online,
	onNext,
}: SetupStepProps) {
	const queryClient = useQueryClient()
	const templates = useQuery(templatesQueryOptions())
	const [selected, setSelected] = useState<string | null>(null)
	const [applied, setApplied] = useState<string | null>(null)

	const apply = useActionMutation({
		mutationFn: (templateId: string) =>
			applyConfigTemplateFn({ data: { templateId, domiaKey } }),
		failureTitle: m.toast_template_apply_failed,
		onDone: (data, templateId) => {
			const template = (templates.data ?? []).find((t) => t.id === templateId)
			setApplied(templateId)
			toast.success(
				m.toast_template_applied({
					template: template?.name ?? templateId,
					name: domiaName,
				}),
				{
					description: data?.apply
						? summarizeApply(data.apply)
						: m.toast_template_applied_desc({ name: domiaName }),
				},
			)
			void Promise.all([
				queryClient.invalidateQueries({ queryKey: ["fleet"] }),
				queryClient.invalidateQueries({ queryKey: ["config", domiaKey] }),
				queryClient.invalidateQueries({ queryKey: ["setup-targets"] }),
				queryClient.invalidateQueries({ queryKey: ["setup-candidates"] }),
			])
		},
	})

	const onApply = () => {
		if (!selected) return
		apply.mutate(selected)
	}

	return (
		<StepShell
			title={m.setup_template_title()}
			description={m.setup_template_desc()}
			onSkip={onNext}
			primary={
				applied && applied === selected ? (
					<ContinueButton onClick={onNext} />
				) : (
					<Button
						type="button"
						disabled={!selected || !online || apply.isPending || isDemoMode()}
						onClick={onApply}
					>
						{apply.isPending && <Loader2 className="size-4 animate-spin" />}
						{m.templates_apply()}
					</Button>
				)
			}
		>
			{templates.isLoading ? (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} className="h-20 w-full" />
					))}
				</div>
			) : templates.isError ? (
				<p className="text-destructive text-sm">{m.templates_load_error()}</p>
			) : (templates.data ?? []).length === 0 ? (
				<p className="text-muted-foreground text-sm">{m.templates_empty()}</p>
			) : (
				<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
					{(templates.data ?? []).map((t) => {
						const active = selected === t.id
						return (
							<button
								key={t.id}
								type="button"
								onClick={() => setSelected(t.id)}
								className={cn(
									"flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
									active
										? "border-primary bg-primary/5"
										: "hover:border-primary/50 hover:bg-muted/40",
								)}
							>
								<div className="bg-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full">
									{active ? (
										<Check className="text-primary size-4" />
									) : (
										<Layers className="size-4" />
									)}
								</div>
								<div className="min-w-0 space-y-0.5">
									<div className="flex items-center gap-1.5">
										<p className="truncate text-sm font-medium">{t.name}</p>
										{t.isSystem && (
											<Badge variant="secondary" className="text-[10px]">
												{m.templates_system_badge()}
											</Badge>
										)}
										{applied === t.id && (
											<Badge className="text-[10px]">
												{m.setup_template_applied_badge()}
											</Badge>
										)}
									</div>
									<p className="text-muted-foreground line-clamp-3 text-xs">
										{t.description || m.templates_no_description()}
									</p>
								</div>
							</button>
						)
					})}
				</div>
			)}
			<p className="text-muted-foreground flex items-start gap-2 text-xs">
				<Lock className="mt-0.5 size-3.5 shrink-0" />
				{m.templates_secrets_note()}
			</p>
		</StepShell>
	)
}
