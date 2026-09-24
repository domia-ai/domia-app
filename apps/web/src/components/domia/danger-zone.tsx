import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Eraser, MessageSquareOff, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useActionMutation } from "@/hooks/use-action-mutation"
import { deleteIdentityDataFn, resetConversationFn } from "@/server/domia"
import { isDemoMode } from "@/lib/demo"
import type { DangerZoneProps } from "@/types/domia"

export function DangerZone({ domiaKey, domiaName, online }: DangerZoneProps) {
	const demo = isDemoMode()
	const router = useRouter()
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const [typed, setTyped] = useState("")

	const invalidate = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ["fleet"] }),
			queryClient.invalidateQueries({ queryKey: ["config", domiaKey] }),
			queryClient.invalidateQueries({ queryKey: ["knowledge", domiaKey] }),
			queryClient.invalidateQueries({ queryKey: ["conversations"] }),
			queryClient.invalidateQueries({ queryKey: ["chat-history", domiaKey] }),
		])

	const erase = useActionMutation({
		mutationFn: () =>
			deleteIdentityDataFn({ data: { domiaKey, confirmName: typed } }),
		failureTitle: m.admin_danger_erase_failed,
		onDone: (data) => {
			toast.success(m.admin_danger_erase_done(), {
				description: m.admin_danger_erase_done_desc({
					count: data?.total ?? 0,
				}),
			})
			setOpen(false)
			setTyped("")
			void invalidate()
			void router.invalidate()
		},
	})

	const reset = useActionMutation({
		mutationFn: () => resetConversationFn({ data: domiaKey }),
		failureTitle: m.admin_danger_reset_failed,
		onDone: () => {
			toast.success(m.admin_danger_reset_done())
			void invalidate()
		},
	})

	const confirmed = typed.trim() === domiaName.trim()
	const blocked = demo || !online

	return (
		<Card className="border-destructive/40">
			<CardHeader>
				<CardTitle className="text-destructive flex items-center gap-2 text-base">
					<TriangleAlert className="size-4" />
					{m.admin_danger_title()}
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
					<div className="min-w-0 space-y-0.5">
						<p className="text-sm font-medium">
							{m.admin_danger_reset_title()}
						</p>
						<p className="text-muted-foreground text-xs">
							{m.admin_danger_reset_hint()}
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						disabled={blocked || reset.isPending}
						onClick={() => reset.mutate(undefined)}
					>
						<MessageSquareOff className="size-4" />
						{m.admin_danger_reset_action()}
					</Button>
				</div>

				<div className="border-destructive/40 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
					<div className="min-w-0 space-y-0.5">
						<p className="text-sm font-medium">
							{m.admin_danger_erase_title()}
						</p>
						<p className="text-muted-foreground text-xs">
							{m.admin_danger_erase_hint()}
						</p>
					</div>
					<Dialog
						open={open}
						onOpenChange={(next) => {
							setOpen(next)
							if (!next) setTyped("")
						}}
					>
						<DialogTrigger
							render={
								<Button variant="destructive" size="sm" disabled={blocked}>
									<Eraser className="size-4" />
									{m.admin_danger_erase_action()}
								</Button>
							}
						/>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>{m.admin_danger_erase_title()}</DialogTitle>
								<DialogDescription>
									{m.admin_danger_erase_confirm_desc({ name: domiaName })}
								</DialogDescription>
							</DialogHeader>
							<Field>
								<FieldLabel htmlFor="danger-confirm">
									{m.admin_danger_type_name({ name: domiaName })}
								</FieldLabel>
								<Input
									id="danger-confirm"
									value={typed}
									onChange={(e) => setTyped(e.target.value)}
									placeholder={domiaName}
									autoFocus
								/>
							</Field>
							<DialogFooter className="mt-4">
								<DialogClose
									render={
										<Button type="button" variant="outline">
											{m.dlg_cancel()}
										</Button>
									}
								/>
								<Button
									type="button"
									variant="destructive"
									disabled={!confirmed || erase.isPending}
									onClick={() => erase.mutate(undefined)}
								>
									{erase.isPending
										? m.admin_danger_erasing()
										: m.admin_danger_erase_action()}
								</Button>
							</DialogFooter>
						</DialogContent>
					</Dialog>
				</div>

				{!online && (
					<p className="text-muted-foreground text-xs">
						{m.admin_danger_offline_hint()}
					</p>
				)}
			</CardContent>
		</Card>
	)
}
