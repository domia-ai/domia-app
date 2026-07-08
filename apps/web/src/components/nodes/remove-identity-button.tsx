import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
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
			toast.success(m.toast_identity_removed(), {
				description: m.toast_identity_removed_desc({ name }),
			})
			setOpen(false)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["nodes"] }),
				queryClient.invalidateQueries({ queryKey: ["node", nodeId] }),
				queryClient.invalidateQueries({ queryKey: ["identities"] }),
				queryClient.invalidateQueries({ queryKey: ["fleet"] }),
			])
		} else {
			toast.error(m.err_remove_identity(), {
				description: errText(result.error),
			})
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="outline" size="sm" disabled={demo || !online}>
						<Trash2 className="size-4" />
						{m.dlg_remove_identity_trigger()}
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.dlg_remove_identity_title({ name })}</DialogTitle>
					<DialogDescription>{m.dlg_remove_identity_desc()}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose
						render={<Button variant="outline">{m.dlg_cancel()}</Button>}
					/>
					<Button
						variant="destructive"
						onClick={onConfirm}
						disabled={mutation.isPending}
					>
						{mutation.isPending
							? m.dlg_removing()
							: m.dlg_remove_identity_trigger()}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
