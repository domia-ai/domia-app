import { useState } from "react"
import { Power } from "lucide-react"
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
import { restartDomiaFn } from "@/server/config"

export function RestartButton({
	domiaKey,
	domiaName,
	online,
}: {
	domiaKey: string
	domiaName: string
	online: boolean
}) {
	const [open, setOpen] = useState(false)

	const mutation = useActionMutation({
		mutationFn: () => restartDomiaFn({ data: domiaKey }),
		failureTitle: m.toast_restart_failed,
		onDone: () => {
			toast.success(m.toast_restart_requested(), {
				description: m.toast_restart_requested_desc({ name: domiaName }),
			})
			setOpen(false)
		},
	})

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="outline" disabled={!online}>
						<Power className="size-4" />
						{m.dlg_restart_trigger()}
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.dlg_restart_title({ name: domiaName })}</DialogTitle>
					<DialogDescription>{m.dlg_restart_desc()}</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose
						render={<Button variant="ghost">{m.dlg_cancel()}</Button>}
					/>
					<Button
						variant="destructive"
						disabled={mutation.isPending}
						onClick={() => mutation.mutate(undefined)}
					>
						<Power className="size-4" />
						{mutation.isPending ? m.dlg_restarting() : m.dlg_restart_now()}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
