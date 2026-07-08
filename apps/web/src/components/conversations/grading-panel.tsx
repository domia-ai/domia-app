import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Plus, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { isDemoMode } from "@/lib/demo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
	Field,
	FieldContent,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field"
import { gradeInteraction } from "@/server/grading"
import { gradeSchema } from "@/schemas/grading"
import { SUGGESTED_TAGS } from "@/constants/grading"
import type { GradingPanelProps } from "@/types/conversations"

export function GradingPanel({ interactionId, initial }: GradingPanelProps) {
	const [newTag, setNewTag] = useState("")
	const queryClient = useQueryClient()
	const router = useRouter()

	const form = useForm({
		defaultValues: {
			rating: (initial?.rating as "up" | "down" | null) ?? null,
			correction: initial?.correction ?? "",
			tags: (initial?.tags as string[] | null) ?? [],
		},
		validators: { onChange: gradeSchema },
		onSubmit: async ({ value }) => {
			const result = await gradeInteraction({
				data: {
					interactionId,
					rating: value.rating,
					correction: value.correction.trim() || null,
					tags: value.tags.length ? value.tags : null,
				},
			})
			if (result.ok) {
				toast.success(m.toast_evaluation_saved(), {
					description: m.toast_evaluation_saved_desc(),
				})
				queryClient.invalidateQueries({ queryKey: ["conversations"] })
				queryClient.invalidateQueries({ queryKey: ["conversation-stats"] })
				void router.invalidate()
			} else {
				toast.error(m.toast_config_save_failed(), {
					description: errText(result.error),
				})
			}
		},
	})

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault()
				void form.handleSubmit()
			}}
		>
			<FieldGroup>
				<form.Field name="rating">
					{(field) => (
						<Field>
							<FieldLabel>{m.conv_col_rating()}</FieldLabel>
							<div className="flex items-center gap-2">
								<Button
									type="button"
									variant={field.state.value === "up" ? "default" : "outline"}
									size="sm"
									onClick={() =>
										field.handleChange(field.state.value === "up" ? null : "up")
									}
									className={cn(
										field.state.value === "up" &&
											"bg-success hover:bg-success/90",
									)}
								>
									<ThumbsUp className="size-4" /> {m.conv_rating_good()}
								</Button>
								<Button
									type="button"
									variant={field.state.value === "down" ? "default" : "outline"}
									size="sm"
									onClick={() =>
										field.handleChange(
											field.state.value === "down" ? null : "down",
										)
									}
									className={cn(
										field.state.value === "down" &&
											"bg-destructive hover:bg-destructive/90",
									)}
								>
									<ThumbsDown className="size-4" /> {m.conv_rating_needs_work()}
								</Button>
							</div>
						</Field>
					)}
				</form.Field>

				<form.Field name="correction">
					{(field) => (
						<Field>
							<FieldLabel htmlFor={field.name}>
								Correction / ideal response
							</FieldLabel>
							<FieldContent>
								<Textarea
									id={field.name}
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									onBlur={field.handleBlur}
									placeholder={m.grade_correction_placeholder()}
									rows={3}
								/>
							</FieldContent>
						</Field>
					)}
				</form.Field>

				<form.Field name="tags">
					{(field) => {
						const addTag = (raw: string) => {
							const value = raw.trim().toLowerCase()
							if (value && !field.state.value.includes(value)) {
								field.handleChange([...field.state.value, value])
							}
							setNewTag("")
						}
						return (
							<Field>
								<FieldLabel>{m.conv_col_tags()}</FieldLabel>
								<FieldContent>
									{field.state.value.length > 0 && (
										<div className="flex flex-wrap gap-1.5">
											{field.state.value.map((tag) => (
												<Badge key={tag} variant="secondary" className="gap-1">
													{tag}
													<button
														type="button"
														onClick={() =>
															field.handleChange(
																field.state.value.filter((t) => t !== tag),
															)
														}
													>
														<X className="size-3" />
													</button>
												</Badge>
											))}
										</div>
									)}
									<div className="flex flex-wrap gap-1.5">
										{SUGGESTED_TAGS.filter(
											(t) => !field.state.value.includes(t),
										).map((tag) => (
											<button
												key={tag}
												type="button"
												onClick={() => addTag(tag)}
												className="text-muted-foreground hover:border-foreground hover:text-foreground inline-flex items-center gap-1 rounded-full border border-dashed px-2 py-0.5 text-xs transition-colors"
											>
												<Plus className="size-3" />
												{tag}
											</button>
										))}
									</div>
									<Input
										value={newTag}
										onChange={(e) => setNewTag(e.target.value)}
										onKeyDown={(e) => {
											if (e.key === "Enter") {
												e.preventDefault()
												addTag(newTag)
											}
										}}
										placeholder={m.grade_add_custom_tag()}
										className="h-8"
									/>
								</FieldContent>
							</Field>
						)
					}}
				</form.Field>

				<form.Subscribe selector={(s) => [s.isSubmitting, s.canSubmit]}>
					{([isSubmitting, canSubmit]) => (
						<Button
							type="submit"
							className="w-full"
							disabled={!canSubmit || isSubmitting || isDemoMode()}
						>
							{isDemoMode()
								? "Read-only demo"
								: isSubmitting
									? "Saving…"
									: "Save evaluation"}
						</Button>
					)}
				</form.Subscribe>
			</FieldGroup>
		</form>
	)
}
