import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
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
import { removeIdentityFn } from "@/server/nodes"
import { isDemoMode } from "@/lib/demo"

export function RemoveIdentityButton({
	anchorDomiaKey,
	domiaKey,
	name,
	nodeId,
	online,
}: {
	anchorDomiaKey: string
	domiaKey: string
	name: string
	nodeId: string
	online: boolean
}) {
	const [open, setOpen] = useState(false)
	const queryClient = useQueryClient()
	const demo = isDemoMode()

	const mutation = useMutation({
		mutationFn: () => removeIdentityFn({ data: { anchorDomiaKey, domiaKey } }),
	})

	const onConfirm = async () => {
		const result = await mutation.mutateAsync()
		if (result.ok) {
			toast.success("Identity removed", {
				description: `${name} was soft-disabled — its history and config are kept. You can re-add it later.`,
			})
			setOpen(false)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["nodes"] }),
				queryClient.invalidateQueries({ queryKey: ["node", nodeId] }),
				queryClient.invalidateQueries({ queryKey: ["identities"] }),
				queryClient.invalidateQueries({ queryKey: ["fleet"] }),
			])
		} else {
			toast.error("Could not remove identity", { description: result.error })
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="outline" size="sm" disabled={demo || !online}>
						<Trash2 className="size-4" />
						Remove
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Remove {name}?</DialogTitle>
					<DialogDescription>
						This soft-disables the identity on this node — its history and
						configuration are kept, and it stops responding. The node restarts
						to apply the change. You can re-add it later.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="outline">Cancel</Button>} />
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={mutation.isPending}
					>
						{mutation.isPending ? "Removing…" : "Remove"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
