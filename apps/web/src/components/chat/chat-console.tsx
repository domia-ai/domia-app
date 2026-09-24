import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { errText } from "@/utils/service-errors"
import {
	ArrowRight,
	MessageSquareOff,
	MessagesSquare,
	Square,
} from "lucide-react"
import { m } from "@/paraglide/messages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useActionQuery } from "@/hooks/use-query-state"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { cancelTurn } from "@/server/rooms"
import { resetConversationFn } from "@/server/domia"
import { chatHistoryQueryOptions } from "@/server/chat"
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
import {
	MessageScrollerProvider,
	MessageScroller,
	MessageScrollerViewport,
	MessageScrollerContent,
	MessageScrollerItem,
	MessageScrollerButton,
} from "@/components/ui/message-scroller"
import { Composer } from "./composer"
import { TurnBubble } from "./turn-bubble"
import { LiveVoice } from "./live-voice"
import { useChatStream } from "./use-chat-stream"
import { sendMessage } from "@/server/chat"
import { accentFor } from "@/utils/accent"
import { isDemoMode } from "@/lib/demo"
import { isOnline } from "@/utils/presence"
import type { ChatConsoleProps, ChatTurn, SendMessageInput } from "@/types/chat"

export function ChatConsole({ domias, initialKey }: ChatConsoleProps) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const stream = useChatStream()
	const selectedKey = initialKey
	const [threads, setThreads] = useState<Record<string, ChatTurn[]>>({})
	const [pending, setPending] = useState(false)
	const [streamingId, setStreamingId] = useState<string | null>(null)
	const activeRef = useRef<{ key: string; id: string } | null>(null)
	const cancelledRef = useRef<Set<string>>(new Set())

	const selected = domias.find((d) => d.domiaKey === selectedKey) ?? domias[0]
	const online = !!selected && isOnline(selected.lastSeenAt)
	const config = selected ? selected.config : null
	const seeded = threads[selectedKey] !== undefined
	const { query: history, state: historyState } = useActionQuery({
		...chatHistoryQueryOptions(selectedKey),
		enabled: !!selectedKey && !seeded,
	})
	const turns = useMemo(
		() => threads[selectedKey] ?? [],
		[threads, selectedKey],
	)

	useEffect(() => {
		if (seeded) return
		const res = history.data
		if (res?.ok) {
			setThreads((prev) =>
				prev[selectedKey] !== undefined
					? prev
					: { ...prev, [selectedKey]: res.data ?? [] },
			)
		}
	}, [history.data, selectedKey, seeded])

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
		activeRef.current = { key, id: domiaTurnId }
		const res = await sendMessage({ data: input })
		if (cancelledRef.current.has(domiaTurnId)) {
			cancelledRef.current.delete(domiaTurnId)
			return
		}
		setPending(false)
		activeRef.current = null
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
				autoplay: input.speak && !!res.data.audioUrl,
			})
		} else if (!res.ok) {
			patch(key, domiaTurnId, {
				pending: false,
				error: true,
				text: errText(res.error),
			})
			toast.error(errText(res.error))
		}
	}

	const resetChat = useActionMutation({
		mutationFn: () => resetConversationFn({ data: selectedKey }),
		failureTitle: m.admin_danger_reset_failed,
		onDone: () => {
			toast.success(m.admin_danger_reset_done())
			append(selectedKey, {
				id: `reset-${Date.now()}`,
				role: "system",
				kind: "text",
				text: m.chat_reset_marker(),
				at: new Date().toISOString(),
			})
		},
	})

	const runStreamed = async (
		key: string,
		userTurn: ChatTurn,
		domiaTurnId: string,
		input: SendMessageInput,
	) => {
		setPending(true)
		setStreamingId(domiaTurnId)
		activeRef.current = { key, id: domiaTurnId }
		const res = await stream.start({
			domiaKey: key,
			text: input.text ?? "",
			satelliteId: input.satelliteId,
		})
		setStreamingId(null)
		if (cancelledRef.current.has(domiaTurnId)) {
			cancelledRef.current.delete(domiaTurnId)
			stream.reset()
			return
		}
		if (!res.started) {
			stream.reset()
			await run(key, userTurn, domiaTurnId, input)
			return
		}
		setPending(false)
		activeRef.current = null
		if (res.ok) {
			patch(key, domiaTurnId, {
				pending: false,
				text: res.text,
				interactionId: res.runId,
			})
			void queryClient.invalidateQueries({ queryKey: ["chat-history", key] })
		} else {
			const message = res.error ?? m.stream_failed()
			patch(key, domiaTurnId, { pending: false, error: true, text: message })
			toast.error(message)
		}
		stream.reset()
	}

	const onCancel = () => {
		const active = activeRef.current
		if (!active) return
		stream.stop()
		cancelledRef.current.add(active.id)
		patch(active.key, active.id, { pending: false, cancelled: true })
		setPending(false)
		activeRef.current = null
		cancelTurn({
			data: { hostDomiaKey: selectedKey, domiaKey: selectedKey },
		}).catch(() => undefined)
	}

	const onSendText = (text: string, speak: boolean, satelliteId?: string) => {
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
		const input: SendMessageInput = {
			targetDomiaKey: key,
			kind: "text",
			text,
			speak,
			satelliteId,
		}
		if (online && !speak && !isDemoMode()) {
			void runStreamed(key, userTurn, domiaTurnId, input)
			return
		}
		void run(key, userTurn, domiaTurnId, input)
	}

	const onSendVoice = (
		audioBase64: string,
		fileName: string,
		speak: boolean,
		satelliteId?: string,
	) => {
		const key = selectedKey
		const userTurn: ChatTurn = {
			id: crypto.randomUUID(),
			role: "user",
			kind: "voice",
			text: fileName,
			audioUrl: `data:audio/wav;base64,${audioBase64}`,
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
			satelliteId,
		})
	}

	if (!selected) return null

	return (
		<div className="grid gap-6 lg:grid-cols-3">
			<Card className="flex h-[calc(100vh-13rem)] flex-col lg:col-span-2">
				<CardHeader className="flex-row items-center justify-between gap-2 space-y-0 border-b">
					<Select
						value={selectedKey}
						onValueChange={(v) =>
							v && navigate({ to: "/chat", search: { domia: v } })
						}
						items={domias.map((d) => ({ value: d.domiaKey, label: d.name }))}
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
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							disabled={
								!online || pending || isDemoMode() || resetChat.isPending
							}
							onClick={() => resetChat.mutate(undefined)}
						>
							<MessageSquareOff className="size-3.5" />
							{m.admin_danger_reset_action()}
						</Button>
						<StatusPill online={online} />
					</div>
				</CardHeader>

				{!seeded && historyState.status === "error" ? (
					<div className="text-destructive flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-sm">
						<MessagesSquare className="size-8 opacity-40" />
						<p>{historyState.message}</p>
					</div>
				) : !seeded && historyState.status === "loading" ? (
					<div className="flex-1 space-y-3 p-4">
						<Skeleton className="h-14 w-2/3" />
						<Skeleton className="ml-auto h-14 w-2/3" />
						<Skeleton className="h-14 w-1/2" />
					</div>
				) : turns.length === 0 ? (
					<div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center text-sm">
						<MessagesSquare className="size-8 opacity-40" />
						<p>{m.chat_start_conversation({ name: selected.name })}</p>
						<p className="text-xs">{m.chat_empty_hint()}</p>
					</div>
				) : (
					<MessageScrollerProvider
						key={selectedKey}
						autoScroll
						defaultScrollPosition="last-anchor"
						scrollPreviousItemPeek={64}
					>
						<MessageScroller className="min-h-0 flex-1">
							<MessageScrollerViewport>
								<MessageScrollerContent className="p-4">
									{turns.map((turn) => (
										<MessageScrollerItem
											key={turn.id}
											messageId={turn.id}
											scrollAnchor={turn.role === "user"}
										>
											<TurnBubble
												turn={turn}
												domiaKey={selected.domiaKey}
												domiaName={selected.name}
												domiaAvatarId={selected.avatarId}
												stream={turn.id === streamingId ? stream.state : null}
											/>
										</MessageScrollerItem>
									))}
								</MessageScrollerContent>
							</MessageScrollerViewport>
							<MessageScrollerButton />
						</MessageScroller>
					</MessageScrollerProvider>
				)}

				<div className="space-y-3 border-t p-3">
					{pending && (
						<Button
							variant="outline"
							size="sm"
							className="w-full"
							onClick={onCancel}
						>
							<Square className="size-3.5" />
							{m.chat_stop()}
						</Button>
					)}
					<Composer
						disabled={pending}
						domiaKey={selected.domiaKey}
						onSendText={onSendText}
						onSendVoice={onSendVoice}
					/>
					<LiveVoice
						target={{
							domiaKey: selected.domiaKey,
							localIp: selected.localIp,
							httpPort: selected.httpPort,
						}}
						domiaName={selected.name}
						disabled={!online}
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
						{m.chat_open_domia()} <ArrowRight className="size-4" />
					</Link>
					<p className="text-muted-foreground border-t pt-3 text-xs">
						{m.chat_live_channel_note()}
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
