import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
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
import { createIdentityFn } from "@/server/nodes"
import { buildAddIdentityFormSchema } from "@/schemas/satellites"
import { isDemoMode } from "@/lib/demo"

export function AddIdentityDialog({
	anchorDomiaKey,
	nodeId,
}: {
	anchorDomiaKey: string
	nodeId: string
}) {
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const demo = isDemoMode()

	const form = useForm({
		defaultValues: { name: "" },
		validators: { onChange: buildAddIdentityFormSchema() },
		onSubmit: async ({ value }) => {
			const trimmed = value.name.trim()
			const result = await createIdentityFn({
				data: { anchorDomiaKey, name: trimmed },
			})
			if (result.ok) {
				toast.success(m.toast_identity_created(), {
					description: m.toast_identity_created_desc({ name: trimmed }),
				})
				form.reset()
				setOpen(false)
				await Promise.all([
					queryClient.invalidateQueries({ queryKey: ["nodes"] }),
					queryClient.invalidateQueries({ queryKey: ["node", nodeId] }),
					queryClient.invalidateQueries({ queryKey: ["identities"] }),
					queryClient.invalidateQueries({ queryKey: ["fleet"] }),
				])
			} else {
				toast.error(m.err_create_identity(), {
					description: errText(result.error),
				})
			}
		},
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button disabled={demo}>
						<Plus className="size-4" />
						{m.dlg_add_identity_trigger()}
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.dlg_add_identity_title()}</DialogTitle>
					<DialogDescription>{m.dlg_add_identity_desc()}</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						e.stopPropagation()
						void form.handleSubmit()
					}}
				>
					<form.Field name="name">
						{(field) => (
							<Field>
								<FieldLabel htmlFor="identity-name">
									{m.dlg_field_name()}
								</FieldLabel>
								<Input
									id="identity-name"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder={m.dlg_identity_name_placeholder()}
									autoFocus
								/>
							</Field>
						)}
					</form.Field>
					<DialogFooter className="mt-4">
						<DialogClose
							render={
								<Button type="button" variant="outline">
									{m.dlg_cancel()}
								</Button>
							}
						/>
						<form.Subscribe
							selector={(s) => ({
								canSubmit: s.canSubmit,
								isSubmitting: s.isSubmitting,
							})}
						>
							{({ canSubmit, isSubmitting }) => (
								<Button type="submit" disabled={!canSubmit || isSubmitting}>
									{isSubmitting ? m.dlg_creating() : m.dlg_create()}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
