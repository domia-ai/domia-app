import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { BookmarkPlus } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import { isDemoMode } from "@/lib/demo"
import {
	createConfigTemplateFn,
	updateConfigTemplateFn,
} from "@/server/templates"
import type { ConfigSnapshot } from "@/types/config"

export function SaveTemplateDialog({
	config,
	onSaved,
	variant = "outline",
	label = m.config_save_as_template(),
	template,
	disabled = false,
}: {
	config: ConfigSnapshot
	onSaved?: () => void
	variant?: "outline" | "default"
	label?: string
	template?: { id: string; name: string; description: string }
	disabled?: boolean
}) {
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const [name, setName] = useState(template?.name ?? "")
	const [description, setDescription] = useState(template?.description ?? "")

	const mutation = useActionMutation({
		mutationFn: () =>
			template
				? updateConfigTemplateFn({
						data: {
							id: template.id,
							name: name.trim(),
							description: description.trim(),
							config,
						},
					})
				: createConfigTemplateFn({
						data: {
							name: name.trim(),
							description: description.trim(),
							config,
						},
					}),
		failureTitle: m.toast_template_save_failed,
		onDone: (data) => {
			const saved = data?.name ?? name.trim()
			toast.success(
				template
					? m.toast_template_updated({ name: saved })
					: m.toast_template_saved({ name: saved }),
				{ description: m.toast_template_saved_desc() },
			)
			queryClient.invalidateQueries({ queryKey: ["templates"] })
			setName("")
			setDescription("")
			setOpen(false)
			onSaved?.()
		},
	})

	const onSave = () => {
		if (!name.trim()) return
		mutation.mutate(undefined)
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button
						variant={variant}
						size="sm"
						disabled={disabled || isDemoMode()}
					>
						<BookmarkPlus className="size-4" />
						{label}
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.dlg_save_template_title()}</DialogTitle>
					<DialogDescription>{m.dlg_save_template_desc()}</DialogDescription>
				</DialogHeader>
				<div className="space-y-3">
					<Field>
						<FieldLabel htmlFor="tpl-name">{m.dlg_field_name()}</FieldLabel>
						<Input
							id="tpl-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={m.dlg_template_name_placeholder()}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="tpl-desc">
							{m.dlg_field_description()}
						</FieldLabel>
						<Textarea
							id="tpl-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
							placeholder={m.dlg_template_desc_placeholder()}
						/>
					</Field>
				</div>
				<DialogFooter>
					<DialogClose
						render={<Button variant="ghost">{m.dlg_cancel()}</Button>}
					/>
					<Button
						disabled={!name.trim() || mutation.isPending}
						onClick={onSave}
					>
						{mutation.isPending ? m.dlg_saving() : m.config_save_template()}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
