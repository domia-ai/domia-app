import { useMutation } from "@tanstack/react-query"
import { Square, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { cancelTurn } from "@/server/rooms"
import { isDemoMode } from "@/lib/demo"
import type { PresenceEntry, PresenceStatus } from "@/types/rooms"

const statusColor: Record<PresenceStatus, string> = {
	idle: "bg-muted-foreground/40",
	listening: "bg-sky-500",
	thinking: "bg-amber-500",
	speaking: "bg-emerald-500",
}

const pulses: PresenceStatus[] = ["listening", "thinking", "speaking"]

export function PresencePulse({
	entry,
	name,
	hostDomiaKey,
}: {
	entry: PresenceEntry
	name: string
	hostDomiaKey: string
}) {
	const demo = isDemoMode()
	const active = entry.status === "thinking" || entry.status === "speaking"

	const mutation = useMutation({
		mutationFn: () =>
			cancelTurn({ data: { hostDomiaKey, domiaKey: entry.domiaKey } }),
	})

	const onStop = async () => {
		const result = await mutation.mutateAsync()
		if (result.ok) {
			toast.success(result.data?.aborted ? "Turn stopped" : "Nothing to stop")
		} else {
			toast.error("Could not stop", { description: result.error })
		}
	}

	return (
		<div className="flex items-center gap-2 text-sm">
			<span
				className={cn(
					"size-2 rounded-full",
					statusColor[entry.status],
					pulses.includes(entry.status) && "animate-pulse",
				)}
			/>
			<span className="font-medium">{name}</span>
			<span className="text-muted-foreground text-xs capitalize">
				{entry.status}
			</span>
			{active ? (
				<Button
					size="sm"
					variant="ghost"
					className="ml-auto h-6 px-2 text-xs"
					disabled={demo || mutation.isPending}
					onClick={onStop}
				>
					{mutation.isPending ? (
						<Loader2 className="size-3 animate-spin" />
					) : (
						<Square className="size-3" />
					)}
					Stop
				</Button>
			) : null}
		</div>
	)
}
