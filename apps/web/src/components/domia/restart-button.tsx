import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Power } from "lucide-react"
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

	const mutation = useMutation({
		mutationFn: () => restartDomiaFn({ data: domiaKey }),
	})

	const onConfirm = async () => {
		const result = await mutation.mutateAsync()
		if (result.ok) {
			toast.success(m.toast_restart_requested(), {
				description: m.toast_restart_requested_desc({ name: domiaName }),
			})
			setOpen(false)
		} else {
			toast.error(m.toast_restart_failed(), {
				description: errText(result.error),
			})
		}
	}

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
						onClick={onConfirm}
					>
						<Power className="size-4" />
						{mutation.isPending ? m.dlg_restarting() : m.dlg_restart_now()}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
