import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Power } from "lucide-react"
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
			toast.success("Restart requested", {
				description: `${domiaName} is restarting.`,
			})
			setOpen(false)
		} else {
			toast.error("Could not restart", { description: result.error })
		}
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="outline" disabled={!online}>
						<Power className="size-4" />
						Restart
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Restart {domiaName}?</DialogTitle>
					<DialogDescription>
						The Domia process restarts and reloads its configuration from the
						database. It is briefly unavailable while it comes back.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<DialogClose render={<Button variant="ghost">Cancel</Button>} />
					<Button
						variant="destructive"
						disabled={mutation.isPending}
						onClick={onConfirm}
					>
						<Power className="size-4" />
						{mutation.isPending ? "Restarting…" : "Restart now"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
