import { Link } from "@tanstack/react-router"
import { ArrowUpRight, Cpu, Loader2 } from "lucide-react"
import { Waveform } from "@/components/audio/waveform"
import { Badge } from "@/components/ui/badge"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
	Message,
	MessageAvatar,
	MessageContent,
	MessageFooter,
} from "@/components/ui/message"
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker"
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
	if (turn.role === "user") {
		return (
			<Message align="end">
				<MessageContent>
					{turn.kind === "voice" && turn.audioUrl ? (
						<Waveform
							src={turn.audioUrl}
							accent="input"
							height={28}
							className="w-72 max-w-full self-end"
						/>
					) : null}
					<Bubble align="end" variant="default">
						<BubbleContent className="whitespace-pre-wrap">
							{turn.kind === "voice" ? (turn.transcript ?? "…") : turn.text}
						</BubbleContent>
					</Bubble>
				</MessageContent>
			</Message>
		)
	}

	const flow = FLOW_BY_KEY[flowOf(turn.kind, turn.spoken)]
	const audioSrc =
		turn.audioUrl && turn.interactionId
			? `/api/node-audio?domia=${domiaKey}&id=${turn.interactionId}&kind=tts`
			: null
	const t = turn.timings

	return (
		<Message align="start">
			<MessageAvatar className="bg-transparent">
				<PersonaAvatar
					domiaKey={domiaKey}
					name={domiaName}
					avatarId={domiaAvatarId}
					size="sm"
				/>
			</MessageAvatar>
			<MessageContent>
				{turn.pending ? (
					<Marker role="status">
						<MarkerIcon>
							<Loader2 className="size-3.5 animate-spin" />
						</MarkerIcon>
						<MarkerContent>thinking…</MarkerContent>
					</Marker>
				) : turn.cancelled ? (
					<Marker>
						<MarkerContent className="italic">cancelled</MarkerContent>
					</Marker>
				) : (
					<>
						<Bubble variant={turn.error ? "destructive" : "muted"}>
							<BubbleContent className="whitespace-pre-wrap">
								{turn.text ? (
									turn.text
								) : audioSrc ? (
									<span className="text-muted-foreground italic">
										spoken reply
									</span>
								) : (
									<span className="text-muted-foreground italic">
										no response
									</span>
								)}
							</BubbleContent>
						</Bubble>

						{audioSrc && (
							<Waveform
								src={audioSrc}
								height={28}
								autoPlay={turn.autoplay}
								className="w-72 max-w-full"
							/>
						)}

						{!turn.error && (flow || t || turn.interactionId) && (
							<MessageFooter className="flex-wrap gap-x-3 gap-y-1">
								{flow && (
									<Badge variant="secondary" className="gap-1.5 text-[10px]">
										<span
											className={cn("size-1.5 rounded-full", flow.className)}
										/>
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
							</MessageFooter>
						)}
					</>
				)}
			</MessageContent>
		</Message>
	)
}
