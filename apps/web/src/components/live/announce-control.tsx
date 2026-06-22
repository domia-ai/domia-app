import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Megaphone, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { broadcast } from "@/server/rooms"
import { isDemoMode } from "@/lib/demo"

export function AnnounceControl({ hostDomiaKey }: { hostDomiaKey: string }) {
	const [text, setText] = useState("")
	const demo = isDemoMode()

	const mutation = useMutation({
		mutationFn: (value: string) =>
			broadcast({ data: { hostDomiaKey, text: value } }),
	})

	const onBroadcast = async () => {
		const value = text.trim()
		if (!value) return
		const result = await mutation.mutateAsync(value)
		if (result.ok) {
			toast.success(
				`Announced to ${result.data?.delivered.length ?? 0} room(s)`,
			)
			setText("")
		} else {
			toast.error("Could not announce", { description: result.error })
		}
	}

	return (
		<div className="space-y-2">
			<p className="text-muted-foreground text-xs font-medium uppercase">
				Announce
			</p>
			<Textarea
				value={text}
				onChange={(e) => setText(e.target.value)}
				placeholder="Broadcast to every room on this node…"
				className="min-h-16"
				disabled={demo}
			/>
			<Button
				size="sm"
				disabled={demo || mutation.isPending || !text.trim()}
				onClick={onBroadcast}
			>
				{mutation.isPending ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					<Megaphone className="size-4" />
				)}
				Broadcast
			</Button>
		</div>
	)
}
