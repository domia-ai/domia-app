import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import { toast } from "sonner"
import { ArrowRight, MessagesSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { StatusPill } from "@/components/domia/status"
import { CapabilityChips } from "@/components/domia/capability-chips"
import { MoodRadar } from "@/components/domia/mood-radar"
import { Composer } from "./composer"
import { TurnBubble } from "./turn-bubble"
import { sendMessage } from "@/server/chat"
import { accentFor } from "@/utils/accent"
import { isOnline } from "@/utils/presence"
import type { ChatConsoleProps, ChatTurn, SendMessageInput } from "@/types/chat"

export function ChatConsole({ domias, initialKey }: ChatConsoleProps) {
	const [selectedKey, setSelectedKey] = useState(initialKey)
	const [threads, setThreads] = useState<Record<string, ChatTurn[]>>({})
	const [pending, setPending] = useState(false)
	const scrollRef = useRef<HTMLDivElement | null>(null)

	const selected = domias.find((d) => d.domiaKey === selectedKey) ?? domias[0]
	const config = selected ? selected.config : null
	const turns = useMemo(
		() => threads[selectedKey] ?? [],
		[threads, selectedKey],
	)

	useEffect(() => {
		scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
	}, [turns])

	const append = (key: string, ...t: ChatTurn[]) =>
		setThreads((prev) => ({ ...prev, [key]: [...(prev[key] ?? []), ...t] }))

	const patch = (key: string, id: string, fields: Partial<ChatTurn>) =>
		setThreads((prev) => ({
			...prev,
			[key]: (prev[key] ?? []).map((t) =>
				t.id === id ? { ...t, ...fields } : t,
			),
		}))

	const run = async (
		key: string,
		userTurn: ChatTurn,
		domiaTurnId: string,
		input: SendMessageInput,
	) => {
		setPending(true)
		const res = await sendMessage({ data: input })
		setPending(false)
		if (res.ok && res.data) {
			if (input.kind === "voice" && res.data.transcript) {
				patch(key, userTurn.id, { transcript: res.data.transcript })
			}
			patch(key, domiaTurnId, {
				pending: false,
				text: res.data.reply,
				interactionId: res.data.interactionId,
				audioUrl: res.data.audioUrl,
				timings: res.data.timings,
			})
		} else if (!res.ok) {
			patch(key, domiaTurnId, { pending: false, error: true, text: res.error })
			toast.error(res.error)
		}
	}

	const onSendText = (text: string, speak: boolean) => {
		const key = selectedKey
		const userTurn: ChatTurn = {
			id: crypto.randomUUID(),
			role: "user",
			kind: "text",
			text,
			at: new Date().toISOString(),
		}
		const domiaTurnId = crypto.randomUUID()
		append(key, userTurn, {
			id: domiaTurnId,
			role: "domia",
			kind: "text",
			text: "",
			at: new Date().toISOString(),
			pending: true,
			spoken: speak,
		})
		void run(key, userTurn, domiaTurnId, {
			targetDomiaKey: key,
			kind: "text",
			text,
			speak,
		})
	}

	const onSendVoice = (
		audioBase64: string,
		fileName: string,
		speak: boolean,
	) => {
		const key = selectedKey
		const userTurn: ChatTurn = {
			id: crypto.randomUUID(),
			role: "user",
			kind: "voice",
			text: fileName,
			at: new Date().toISOString(),
		}
		const domiaTurnId = crypto.randomUUID()
		append(key, userTurn, {
			id: domiaTurnId,
			role: "domia",
			kind: "voice",
			text: "",
			at: new Date().toISOString(),
			pending: true,
			spoken: speak,
		})
		void run(key, userTurn, domiaTurnId, {
			targetDomiaKey: key,
			kind: "voice",
			audioBase64,
			speak,
		})
	}

	if (!selected) return null
	const online = isOnline(selected.lastSeenAt)

	return (
		<div className="grid gap-6 lg:grid-cols-3">
			<Card className="flex h-[calc(100vh-13rem)] flex-col lg:col-span-2">
				<CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b">
					<Select
						value={selectedKey}
						onValueChange={(v) => v && setSelectedKey(v)}
					>
						<SelectTrigger className="h-9 w-56">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{domias.map((d) => (
								<SelectItem key={d.domiaKey} value={d.domiaKey}>
									{d.name}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<StatusPill online={online} />
				</CardHeader>

				<div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
					{turns.length === 0 ? (
						<div className="text-muted-foreground flex h-full flex-col items-center justify-center gap-2 text-center text-sm">
							<MessagesSquare className="size-8 opacity-40" />
							<p>Start a conversation with {selected.name}.</p>
							<p className="text-xs">
								Type, toggle “Speak replies”, or upload a WAV to test any flow.
							</p>
						</div>
					) : (
						turns.map((turn) => (
							<TurnBubble
								key={turn.id}
								turn={turn}
								domiaKey={selected.domiaKey}
								domiaName={selected.name}
								domiaAvatarId={selected.avatarId}
							/>
						))
					)}
				</div>

				<div className="border-t p-3">
					<Composer
						disabled={pending}
						onSendText={onSendText}
						onSendVoice={onSendVoice}
					/>
				</div>
			</Card>

			<Card className="h-fit">
				<CardHeader>
					<div className="flex items-center gap-3">
						<PersonaAvatar
							domiaKey={selected.domiaKey}
							name={selected.name}
							avatarId={selected.avatarId}
							size="lg"
						/>
						<div className="min-w-0 flex-1">
							<div className="flex items-center gap-2">
								<CardTitle className="truncate">{selected.name}</CardTitle>
								<StatusPill online={online} />
							</div>
							<p className="text-muted-foreground text-sm">
								{config?.characterProfile?.profession ??
									config?.characterProfile?.name ??
									"—"}
							</p>
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{config?.characterProfile?.personality && (
						<p className="text-muted-foreground text-sm leading-relaxed">
							{config.characterProfile.personality}
						</p>
					)}
					{config?.emotionState && (
						<MoodRadar
							emotion={config.emotionState}
							accent={accentFor(selected.domiaKey)}
						/>
					)}
					{config?.runtimeCapabilities && (
						<CapabilityChips
							capabilities={config.runtimeCapabilities}
							size="sm"
						/>
					)}
					<Link
						to="/domias/$key"
						params={{ key: selected.domiaKey }}
						className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
					>
						Open Domia <ArrowRight className="size-4" />
					</Link>
					<p className="text-muted-foreground border-t pt-3 text-xs">
						This is a live channel — every exchange is a real interaction,
						logged and visible in Conversations.
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
