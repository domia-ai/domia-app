import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
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
import { useActionMutation } from "@/hooks/use-action-mutation"
import { importConfigFn } from "@/server/config"
import { isDemoMode } from "@/lib/demo"
import type { RenameIdentityProps } from "@/types/domia"

export function RenameIdentity({
	domiaKey,
	domiaName,
	online,
}: RenameIdentityProps) {
	const demo = isDemoMode()
	const router = useRouter()
	const queryClient = useQueryClient()
	const [open, setOpen] = useState(false)
	const [name, setName] = useState(domiaName)

	const rename = useActionMutation({
		mutationFn: (next: string) =>
			importConfigFn({
				data: { domiaKey, bundle: { domia: { name: next } } },
			}),
		failureTitle: m.identity_rename_failed,
		onDone: async (_data, next) => {
			toast.success(m.identity_renamed(), {
				description: m.identity_renamed_desc({ name: next }),
			})
			setOpen(false)
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["fleet"] }),
				queryClient.invalidateQueries({ queryKey: ["nodes"] }),
				queryClient.invalidateQueries({ queryKey: ["config", domiaKey] }),
				queryClient.invalidateQueries({ queryKey: ["domia-targets"] }),
			])
			void router.invalidate()
		},
	})

	const trimmed = name.trim()
	const dirty = trimmed.length > 0 && trimmed !== domiaName

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (next) setName(domiaName)
			}}
		>
			<DialogTrigger
				render={
					<Button
						variant="ghost"
						size="icon"
						className="text-muted-foreground hover:text-foreground"
						title={m.config_field_domia_name()}
						disabled={demo || !online}
					>
						<Pencil className="size-4" />
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.config_section_identity()}</DialogTitle>
					<DialogDescription>
						{m.config_section_identity_desc()}
					</DialogDescription>
				</DialogHeader>
				<Field>
					<FieldLabel htmlFor="rename-domia">
						{m.config_field_domia_name()}
					</FieldLabel>
					<Input
						id="rename-domia"
						value={name}
						onChange={(e) => setName(e.target.value)}
						maxLength={80}
						autoFocus
					/>
					<p className="text-muted-foreground text-[11px]">
						{m.config_hint_domia_name()}
					</p>
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
						disabled={!dirty || rename.isPending}
						onClick={() => rename.mutate(trimmed)}
					>
						{rename.isPending ? m.config_saving() : m.config_save_changes()}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
