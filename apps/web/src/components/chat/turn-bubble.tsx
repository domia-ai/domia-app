import { Link } from "@tanstack/react-router"
import { ArrowUpRight, Cpu, Loader2, Mic } from "lucide-react"
import { Waveform } from "@/components/audio/waveform"
import { Badge } from "@/components/ui/badge"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { cn } from "@/lib/utils"
import { formatMs } from "@/utils/format"
import { FLOWS } from "@/constants/conversations"
import type { FlowKey } from "@/types/conversations"
import type { TurnBubbleProps } from "@/types/chat"

const FLOW_BY_KEY = Object.fromEntries(FLOWS.map((f) => [f.key, f]))

const flowOf = (kind: string, spoken: boolean | undefined): FlowKey =>
	kind === "voice" ? (spoken ? "s2s" : "v2t") : spoken ? "t2s" : "t2t"

export function TurnBubble({
	turn,
	domiaKey,
	domiaName,
	domiaAvatarId,
}: TurnBubbleProps) {
	const isUser = turn.role === "user"

	if (isUser) {
		return (
			<div className="flex justify-end">
				<div className="bg-primary text-primary-foreground max-w-[80%] rounded-2xl rounded-br-sm px-3.5 py-2">
					{turn.kind === "voice" && (
						<span className="mb-0.5 flex items-center gap-1 text-xs opacity-80">
							<Mic className="size-3" />
							{turn.text}
						</span>
					)}
					<p className="text-sm whitespace-pre-wrap">
						{turn.kind === "voice" ? (turn.transcript ?? "…") : turn.text}
					</p>
				</div>
			</div>
		)
	}

	const flow = FLOW_BY_KEY[flowOf(turn.kind, turn.spoken)]
	const audioSrc =
		turn.audioUrl && turn.interactionId
			? `/api/node-audio?domia=${domiaKey}&id=${turn.interactionId}&kind=tts`
			: null
	const t = turn.timings

	return (
		<div className="flex items-start gap-2.5">
			<PersonaAvatar
				domiaKey={domiaKey}
				name={domiaName}
				avatarId={domiaAvatarId}
				size="sm"
			/>
			<div className="max-w-[80%] space-y-1.5">
				<div
					className={cn(
						"bg-muted rounded-2xl rounded-tl-sm px-3.5 py-2",
						turn.error && "bg-destructive/10 text-destructive",
					)}
				>
					{turn.pending ? (
						<span className="text-muted-foreground flex items-center gap-1.5 text-sm">
							<Loader2 className="size-3.5 animate-spin" />
							thinking…
						</span>
					) : turn.cancelled ? (
						<p className="text-muted-foreground text-sm italic">cancelled</p>
					) : turn.text ? (
						<p className="text-sm whitespace-pre-wrap">{turn.text}</p>
					) : audioSrc ? (
						<p className="text-muted-foreground text-sm italic">spoken reply</p>
					) : (
						<p className="text-muted-foreground text-sm italic">no response</p>
					)}
				</div>

				{audioSrc && (
					<Waveform
						src={audioSrc}
						height={28}
						autoPlay={turn.autoplay}
						className="w-72 max-w-full"
					/>
				)}

				{!turn.pending && !turn.error && (
					<div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
						{flow && (
							<Badge variant="secondary" className="gap-1.5 text-[10px]">
								<span className={cn("size-1.5 rounded-full", flow.className)} />
								{flow.key.toUpperCase()}
							</Badge>
						)}
						{t && (
							<span className="flex items-center gap-1">
								<Cpu className="size-3" />
								<span className="font-mono tabular-nums">
									{turn.kind === "voice" && `stt ${formatMs(t.sttMs)} · `}
									llm {formatMs(t.llmMs)}
									{turn.spoken && ` · tts ${formatMs(t.ttsMs)}`}
								</span>
							</span>
						)}
						{t && (
							<span className="font-mono tabular-nums">
								{formatMs(t.totalMs)} total
							</span>
						)}
						{turn.interactionId && (
							<Link
								to="/conversations/$id"
								params={{ id: turn.interactionId }}
								className="hover:text-foreground inline-flex items-center gap-0.5"
							>
								trace <ArrowUpRight className="size-3" />
							</Link>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
