import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { BookmarkPlus } from "lucide-react"
import { toast } from "sonner"
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
import {
	createConfigTemplateFn,
	updateConfigTemplateFn,
} from "@/server/templates"
import type { ConfigSnapshot } from "@/types/config"

export function SaveTemplateDialog({
	config,
	onSaved,
	variant = "outline",
	label = "Save as template",
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

	const mutation = useMutation({
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
	})

	const onSave = async () => {
		if (!name.trim()) return
		const result = await mutation.mutateAsync()
		if (result.ok && result.data) {
			toast.success(
				template
					? `Updated template “${result.data.name}”`
					: `Saved template “${result.data.name}”`,
				{ description: "Apply it to any Domia from Templates." },
			)
			queryClient.invalidateQueries({ queryKey: ["templates"] })
			setName("")
			setDescription("")
			setOpen(false)
			onSaved?.()
		} else {
			toast.error("Could not save template", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant={variant} size="sm" disabled={disabled}>
						<BookmarkPlus className="size-4" />
						{label}
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Save as template</DialogTitle>
					<DialogDescription>
						Captures this Domia's full configuration — persona, voice, engines,
						models, capabilities and tuning — minus device identity and network.
						Apply it to any Domia later.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-3">
					<Field>
						<FieldLabel htmlFor="tpl-name">Name</FieldLabel>
						<Input
							id="tpl-name"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder="e.g. Living-room hub"
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="tpl-desc">Description</FieldLabel>
						<Textarea
							id="tpl-desc"
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							rows={2}
							placeholder="Optional"
						/>
					</Field>
				</div>
				<DialogFooter>
					<DialogClose render={<Button variant="ghost">Cancel</Button>} />
					<Button
						disabled={!name.trim() || mutation.isPending}
						onClick={onSave}
					>
						{mutation.isPending ? "Saving…" : "Save template"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
