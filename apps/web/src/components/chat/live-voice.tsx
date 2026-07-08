import { m } from "@/paraglide/messages"
import { Loader2, PhoneOff, Radio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { cn } from "@/lib/utils"
import { useLiveVoice, liveVoiceStatusLabel } from "./use-live-voice"
import type { LiveVoiceTarget } from "@/types/chat"

export function LiveVoice({
	target,
	domiaName,
	disabled,
}: {
	target: LiveVoiceTarget
	domiaName: string
	disabled?: boolean
}) {
	const { state, connect, disconnect, connected } = useLiveVoice(target)
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
					{m.chat_go_live()}
				</Button>
				{state.status === "error" && state.error ? (
					<span className="text-destructive text-xs">{state.error}</span>
				) : !reachable ? (
					<span className="text-muted-foreground text-xs">
						{m.chat_address_unknown({ name: domiaName })}
					</span>
				) : (
					<span className="text-muted-foreground text-xs">
						{m.chat_live_hint()}
					</span>
				)}
			</div>
		)
	}

	const phase = state.status

	return (
		<div className="border-border bg-muted/20 flex flex-col items-center gap-4 rounded-lg border p-5">
			<div className="relative flex size-20 items-center justify-center">
				<span
					className={cn(
						"absolute inset-0 rounded-full",
						(phase === "listening" || phase === "ready") &&
							"bg-primary/20 animate-ping",
						phase === "speaking" && "bg-primary/30 animate-pulse",
						phase === "thinking" &&
							"border-primary/40 animate-spin border-2 border-dashed",
					)}
				/>
				<PersonaAvatar
					domiaKey={target.domiaKey}
					name={domiaName}
					avatarId={null}
					size="lg"
				/>
			</div>

			<div className="flex flex-col items-center gap-1 text-center">
				<span className="text-sm font-medium">
					{liveVoiceStatusLabel[phase]}
				</span>
				<span className="text-muted-foreground text-xs">
					Live with {domiaName} · just talk, hands-free
				</span>
			</div>

			<div className="min-h-10 w-full space-y-1 text-center text-sm">
				{state.transcript ? (
					<p className="text-muted-foreground italic">“{state.transcript}”</p>
				) : null}
				{state.reply ? (
					<p className="text-foreground">
						<span className="text-muted-foreground">{domiaName}: </span>
						{state.reply}
					</p>
				) : null}
			</div>

			<Button variant="destructive" size="sm" onClick={disconnect}>
				<PhoneOff className="size-4" /> End conversation
			</Button>
		</div>
	)
}
