import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Field, FieldContent, FieldLabel } from "@/components/ui/field"
import { useMindForm, MindFormFields } from "@/components/domia/mind-form"
import { createTemplateFn, updateTemplateFn } from "@/server/templates"
import { DEFAULT_TEMPLATE_MIND } from "@/constants/mind"
import type { TemplateEditorProps, MindSnapshot } from "@/types"

export function TemplateEditor({ template, onClose }: TemplateEditorProps) {
	const queryClient = useQueryClient()
	const [name, setName] = useState(template?.name ?? "")
	const [description, setDescription] = useState(template?.description ?? "")

	const saveMutation = useMutation({
		mutationFn: (mind: MindSnapshot) =>
			template
				? updateTemplateFn({
						data: { id: template.id, name, description, mind },
					})
				: createTemplateFn({ data: { name, description, mind } }),
	})

	const form = useMindForm(
		template?.mind ?? DEFAULT_TEMPLATE_MIND,
		async (mind) => {
			const result = await saveMutation.mutateAsync(mind)
			if (result.ok && result.data) {
				toast.success(template ? "Template updated" : "Template created")
				queryClient.invalidateQueries({ queryKey: ["templates"] })
				onClose()
			} else {
				toast.error("Could not save template", {
					description: result.ok ? "Empty response" : result.error,
				})
			}
		},
	)

	const onSave = () => {
		if (!name.trim()) {
			toast.error("Name is required")
			return
		}
		void form.handleSubmit()
	}

	return (
		<Dialog open onOpenChange={(o) => !o && onClose()}>
			<DialogContent className="flex max-h-[88vh] flex-col gap-4 sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>
						{template ? "Edit template" : "New template"}
					</DialogTitle>
				</DialogHeader>

				<div className="grid gap-3 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="template-name">Name</FieldLabel>
						<FieldContent>
							<Input
								id="template-name"
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder="e.g. Night Concierge"
							/>
						</FieldContent>
					</Field>
					<Field>
						<FieldLabel htmlFor="template-desc">Description</FieldLabel>
						<FieldContent>
							<Input
								id="template-desc"
								value={description}
								onChange={(e) => setDescription(e.target.value)}
								placeholder="Short summary"
							/>
						</FieldContent>
					</Field>
				</div>

				<Tabs defaultValue="persona" className="flex min-h-0 flex-col">
					<TabsList className="w-full justify-start">
						<TabsTrigger value="persona">Persona</TabsTrigger>
						<TabsTrigger value="emotion">Mood</TabsTrigger>
						<TabsTrigger value="modules">Modules</TabsTrigger>
					</TabsList>
					<div className="max-h-[52vh] min-h-0 overflow-y-auto pt-4 pr-1">
						<MindFormFields form={form} />
					</div>
				</Tabs>

				<div className="flex items-center justify-end gap-2 border-t pt-4">
					<Button type="button" variant="ghost" onClick={onClose}>
						Cancel
					</Button>
					<form.Subscribe selector={(s) => [s.isSubmitting, s.canSubmit]}>
						{([isSubmitting, canSubmit]) => (
							<Button
								type="button"
								onClick={onSave}
								disabled={!canSubmit || isSubmitting}
							>
								{isSubmitting ? "Saving…" : "Save template"}
							</Button>
						)}
					</form.Subscribe>
				</div>
			</DialogContent>
		</Dialog>
	)
}
