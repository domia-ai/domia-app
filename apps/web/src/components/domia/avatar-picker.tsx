import { useRef, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Pencil, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PersonaAvatar } from "./persona-avatar"
import { setAvatarFn } from "@/server/avatars"
import { AVATAR_PRESETS, presetSrc } from "@/constants/avatars"
import { cn } from "@/lib/utils"
import type { SetAvatarInput } from "@/types/avatars"

const MAX_BYTES = 2 * 1024 * 1024

const fileToBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			resolve(result.slice(result.indexOf(",") + 1))
		}
		reader.onerror = () => reject(reader.error)
		reader.readAsDataURL(file)
	})

export function AvatarPicker({
	domiaKey,
	name,
	avatarId,
}: {
	domiaKey: string
	name: string
	avatarId: string | null
}) {
	const router = useRouter()
	const [open, setOpen] = useState(false)
	const fileRef = useRef<HTMLInputElement>(null)

	const mutation = useMutation({
		mutationFn: (input: SetAvatarInput) => setAvatarFn({ data: input }),
		onSuccess: (res) => {
			if (!res.ok) {
				toast.error("Couldn't update avatar", { description: res.error })
				return
			}
			void router.invalidate()
			toast.success("Avatar updated")
			setOpen(false)
		},
		onError: () => toast.error("Couldn't update avatar"),
	})

	const onFile = async (file: File | undefined) => {
		if (!file) return
		if (!file.type.startsWith("image/")) {
			toast.error("Please choose an image file")
			return
		}
		if (file.size > MAX_BYTES) {
			toast.error("Image too large (max 2MB)")
			return
		}
		const dataBase64 = await fileToBase64(file)
		mutation.mutate({ domiaKey, kind: "custom", dataBase64, mime: file.type })
	}

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<button
						type="button"
						className="group relative rounded-full"
						aria-label="Change avatar"
					/>
				}
			>
				<PersonaAvatar
					domiaKey={domiaKey}
					name={name}
					avatarId={avatarId}
					size="lg"
				/>
				<span className="bg-foreground/55 absolute inset-0 flex items-center justify-center rounded-full text-white opacity-0 transition-opacity group-hover:opacity-100">
					<Pencil className="size-4" />
				</span>
			</DialogTrigger>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>Avatar for {name}</DialogTitle>
					<DialogDescription>
						Pick a character or upload your own image. Saved instantly — no
						restart.
					</DialogDescription>
				</DialogHeader>

				<div className="grid grid-cols-4 gap-3">
					{AVATAR_PRESETS.map((p) => (
						<button
							key={p.id}
							type="button"
							title={p.label}
							disabled={mutation.isPending}
							onClick={() =>
								mutation.mutate({
									domiaKey,
									kind: "preset",
									presetId: p.id,
								})
							}
							className={cn(
								"overflow-hidden rounded-full border-2 transition-colors",
								avatarId === p.id
									? "border-primary"
									: "hover:border-border border-transparent",
							)}
						>
							<img
								src={presetSrc(p.id)}
								alt={p.label}
								className="aspect-square size-full object-cover"
							/>
						</button>
					))}
				</div>

				<input
					ref={fileRef}
					type="file"
					accept="image/png,image/jpeg,image/webp,image/gif"
					className="hidden"
					onChange={(e) => void onFile(e.target.files?.[0])}
				/>
				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						className="flex-1"
						disabled={mutation.isPending}
						onClick={() => fileRef.current?.click()}
					>
						<Upload className="size-4" />
						Upload image
					</Button>
					<Button
						variant="ghost"
						disabled={mutation.isPending || !avatarId}
						onClick={() => mutation.mutate({ domiaKey, kind: "clear" })}
					>
						<Trash2 className="size-4" />
						Remove
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
