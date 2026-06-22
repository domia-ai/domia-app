import { useState } from "react"
import { useForm } from "@tanstack/react-form"
import { useQueryClient } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { toast } from "sonner"
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
import { addIdentityFormSchema } from "@/schemas/satellites"
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
		validators: { onChange: addIdentityFormSchema },
		onSubmit: async ({ value }) => {
			const trimmed = value.name.trim()
			const result = await createIdentityFn({
				data: { anchorDomiaKey, name: trimmed },
			})
			if (result.ok) {
				toast.success("Identity created", {
					description: `${trimmed} is being added — the node restarts and it will appear shortly.`,
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
				toast.error("Could not create identity", { description: result.error })
			}
		},
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button disabled={demo}>
						<Plus className="size-4" />
						Add identity
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Add a hosted identity</DialogTitle>
					<DialogDescription>
						Creates a new neutral identity hosted on this node. The node
						restarts to bring it online (all identities it hosts are briefly
						unavailable), then you can configure it.
					</DialogDescription>
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
								<FieldLabel htmlFor="identity-name">Name</FieldLabel>
								<Input
									id="identity-name"
									value={field.state.value}
									onChange={(e) => field.handleChange(e.target.value)}
									placeholder="Kitchen"
									autoFocus
								/>
							</Field>
						)}
					</form.Field>
					<DialogFooter className="mt-4">
						<DialogClose
							render={
								<Button type="button" variant="outline">
									Cancel
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
									{isSubmitting ? "Creating…" : "Create"}
								</Button>
							)}
						</form.Subscribe>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
