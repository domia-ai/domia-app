import { Loader2, Mic, PhoneOff, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useLiveVoice, liveVoiceStatusLabel } from "./use-live-voice"
import type { LiveVoiceTarget } from "@/types/chat"

type LiveVoiceProps = {
	target: LiveVoiceTarget
	domiaName: string
	disabled?: boolean
}

export function LiveVoice({ target, domiaName, disabled }: LiveVoiceProps) {
	const { state, connect, disconnect, startTalk, stopTalk, connected } =
		useLiveVoice(target)
	const reachable = Boolean(target.localIp && target.httpPort)

	if (!connected) {
		return (
			<div className="flex items-center gap-3">
				<Button
					variant="outline"
					size="sm"
					disabled={disabled || !reachable || state.status === "connecting"}
					onClick={() => void connect()}
				>
					{state.status === "connecting" ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Radio className="size-4" />
					)}
					Live voice
				</Button>
				{state.status === "error" && state.error ? (
					<span className="text-destructive text-xs">{state.error}</span>
				) : !reachable ? (
					<span className="text-muted-foreground text-xs">
						{domiaName} address unknown
					</span>
				) : null}
			</div>
		)
	}

	const talking = state.status === "listening"

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-3">
				<Button
					size="lg"
					className={cn(
						"select-none",
						talking && "bg-red-600 hover:bg-red-600",
					)}
					disabled={state.status === "thinking"}
					onPointerDown={startTalk}
					onPointerUp={stopTalk}
					onPointerLeave={stopTalk}
				>
					{state.status === "thinking" || state.status === "speaking" ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Mic className="size-4" />
					)}
					{liveVoiceStatusLabel[state.status]}
				</Button>
				<Button variant="ghost" size="sm" onClick={disconnect}>
					<PhoneOff className="size-4" />
					End
				</Button>
			</div>
			{state.transcript ? (
				<p className="text-muted-foreground text-sm">
					<span className="font-medium">You:</span> {state.transcript}
				</p>
			) : null}
			{state.reply ? (
				<p className="text-sm">
					<span className="font-medium">{domiaName}:</span> {state.reply}
				</p>
			) : null}
		</div>
	)
}
