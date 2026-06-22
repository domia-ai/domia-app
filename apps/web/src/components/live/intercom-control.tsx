import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Radio, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { intercom } from "@/server/rooms"
import { isDemoMode } from "@/lib/demo"
import type { LiveRoom } from "@/types/live"

export function IntercomControl({
	hostDomiaKey,
	rooms,
}: {
	hostDomiaKey: string
	rooms: LiveRoom[]
}) {
	const [from, setFrom] = useState("")
	const [to, setTo] = useState("")
	const [intercomOn, setIntercomOn] = useState(false)
	const demo = isDemoMode()

	const mutation = useMutation({
		mutationFn: (link: { from: string; to: string | null }) =>
			intercom({ data: { hostDomiaKey, from: link.from, to: link.to } }),
	})

	const onToggle = async () => {
		if (!intercomOn && (!from || !to || from === to)) {
			toast.error("Pick two different rooms")
			return
		}
		const result = await mutation.mutateAsync({
			from,
			to: intercomOn ? null : to,
		})
		if (result.ok) {
			setIntercomOn(!intercomOn)
			toast.success(intercomOn ? "Intercom stopped" : "Intercom live")
		} else {
			toast.error("Could not set intercom", { description: result.error })
		}
	}

	return (
		<div className="space-y-2">
			<p className="text-muted-foreground text-xs font-medium uppercase">
				Intercom
			</p>
			<div className="flex items-center gap-2">
				<Select
					value={from}
					onValueChange={(v) => setFrom(v ?? "")}
					disabled={demo || intercomOn}
				>
					<SelectTrigger className="h-8 flex-1">
						<SelectValue placeholder="From" />
					</SelectTrigger>
					<SelectContent>
						{rooms.map((r) => (
							<SelectItem key={r.domiaKey} value={r.domiaKey}>
								{r.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<span className="text-muted-foreground text-xs">→</span>
				<Select
					value={to}
					onValueChange={(v) => setTo(v ?? "")}
					disabled={demo || intercomOn}
				>
					<SelectTrigger className="h-8 flex-1">
						<SelectValue placeholder="To" />
					</SelectTrigger>
					<SelectContent>
						{rooms.map((r) => (
							<SelectItem key={r.domiaKey} value={r.domiaKey}>
								{r.name}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
			<Button
				size="sm"
				variant={intercomOn ? "destructive" : "outline"}
				disabled={demo || mutation.isPending}
				onClick={onToggle}
			>
				{mutation.isPending ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					<Radio className="size-4" />
				)}
				{intercomOn ? "Stop intercom" : "Start intercom"}
			</Button>
		</div>
	)
}
