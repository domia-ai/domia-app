import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Megaphone, Radio, Loader2, Square } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { roomPresence, broadcast, intercom, cancelTurn } from "@/server/rooms"
import type { MeshDomiaRow } from "@/types/fleet"
import type { PresenceEntry, PresenceStatus } from "@/types/rooms"

const statusColor: Record<PresenceStatus, string> = {
	idle: "bg-muted-foreground/40",
	listening: "bg-sky-500",
	thinking: "bg-amber-500",
	speaking: "bg-emerald-500",
}

export function RoomsPanel({ domias }: { domias: MeshDomiaRow[] }) {
	const hosts = useMemo(() => {
		const map = new Map<string, MeshDomiaRow[]>()
		for (const d of domias) {
			if (!d.localIp || !d.httpPort) continue
			const key = `${d.localIp}:${d.httpPort}`
			const arr = map.get(key) ?? []
			arr.push(d)
			map.set(key, arr)
		}
		return [...map.entries()].map(([addr, rooms]) => ({
			addr,
			rooms,
			hostKey: rooms[0].domiaKey,
		}))
	}, [domias])

	const [hostAddr, setHostAddr] = useState(hosts[0]?.addr ?? "")
	const host = hosts.find((h) => h.addr === hostAddr) ?? hosts[0]
	const [presence, setPresence] = useState<PresenceEntry[]>([])
	const [text, setText] = useState("")
	const [busy, setBusy] = useState(false)
	const [from, setFrom] = useState("")
	const [to, setTo] = useState("")
	const [intercomOn, setIntercomOn] = useState(false)
	const [stopping, setStopping] = useState<string | null>(null)

	useEffect(() => {
		if (!host) return
		let alive = true
		const poll = async () => {
			const r = await roomPresence({ data: { hostDomiaKey: host.hostKey } })
			if (alive && r.ok && r.data) setPresence(r.data)
		}
		void poll()
		const id = setInterval(() => void poll(), 3000)
		return () => {
			alive = false
			clearInterval(id)
		}
	}, [host])

	if (!host) return null

	const nameOf = (key: string) =>
		host.rooms.find((r) => r.domiaKey === key)?.name ?? key

	const onBroadcast = async () => {
		if (!text.trim()) return
		setBusy(true)
		const r = await broadcast({ data: { hostDomiaKey: host.hostKey, text } })
		setBusy(false)
		if (r.ok) {
			toast.success(`Announced to ${r.data?.delivered.length ?? 0} room(s)`)
			setText("")
		} else toast.error(r.error)
	}

	const onStop = async (domiaKey: string) => {
		setStopping(domiaKey)
		const r = await cancelTurn({
			data: { hostDomiaKey: host.hostKey, domiaKey },
		})
		setStopping(null)
		if (r.ok) {
			toast.success(r.data?.aborted ? "Turn stopped" : "Nothing to stop")
		} else toast.error(r.error)
	}

	const onIntercom = async () => {
		if (!intercomOn && (!from || !to || from === to)) {
			toast.error("Pick two different rooms")
			return
		}
		setBusy(true)
		const r = await intercom({
			data: {
				hostDomiaKey: host.hostKey,
				from,
				to: intercomOn ? null : to,
			},
		})
		setBusy(false)
		if (r.ok) {
			setIntercomOn(!intercomOn)
			toast.success(intercomOn ? "Intercom stopped" : "Intercom live")
		} else toast.error(r.error)
	}

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-2">
				<CardTitle className="text-base">Rooms</CardTitle>
				{hosts.length > 1 ? (
					<Select value={hostAddr} onValueChange={(v) => setHostAddr(v ?? "")}>
						<SelectTrigger className="h-8 w-44">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{hosts.map((h) => (
								<SelectItem key={h.addr} value={h.addr}>
									{h.addr}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				) : null}
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="space-y-2">
					{presence.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No satellites connected on this host.
						</p>
					) : (
						presence.map((p) => (
							<div key={p.domiaKey} className="flex items-center gap-2 text-sm">
								<span
									className={cn(
										"size-2 rounded-full",
										p.satellites.some((s) => s.connected)
											? statusColor[p.status]
											: "bg-muted-foreground/20",
									)}
								/>
								<span className="font-medium">{nameOf(p.domiaKey)}</span>
								<span className="text-muted-foreground text-xs">
									{p.satellites.some((s) => s.connected) ? p.status : "offline"}
								</span>
								{p.status === "thinking" || p.status === "speaking" ? (
									<Button
										size="sm"
										variant="ghost"
										className="ml-auto h-6 px-2 text-xs"
										disabled={stopping === p.domiaKey}
										onClick={() => onStop(p.domiaKey)}
									>
										{stopping === p.domiaKey ? (
											<Loader2 className="size-3 animate-spin" />
										) : (
											<Square className="size-3" />
										)}
										Stop
									</Button>
								) : null}
							</div>
						))
					)}
				</div>

				<div className="space-y-2">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Announce
					</p>
					<Textarea
						value={text}
						onChange={(e) => setText(e.target.value)}
						placeholder="Broadcast to every room…"
						className="min-h-16"
					/>
					<Button
						size="sm"
						disabled={busy || !text.trim()}
						onClick={onBroadcast}
					>
						<Megaphone className="size-4" />
						Broadcast
					</Button>
				</div>

				<div className="space-y-2">
					<p className="text-muted-foreground text-xs font-medium uppercase">
						Intercom
					</p>
					<div className="flex items-center gap-2">
						<Select
							value={from}
							onValueChange={(v) => setFrom(v ?? "")}
							disabled={intercomOn}
						>
							<SelectTrigger className="h-8 flex-1">
								<SelectValue placeholder="From" />
							</SelectTrigger>
							<SelectContent>
								{host.rooms.map((r) => (
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
							disabled={intercomOn}
						>
							<SelectTrigger className="h-8 flex-1">
								<SelectValue placeholder="To" />
							</SelectTrigger>
							<SelectContent>
								{host.rooms.map((r) => (
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
						disabled={busy}
						onClick={onIntercom}
					>
						{busy ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Radio className="size-4" />
						)}
						{intercomOn ? "Stop intercom" : "Start intercom"}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
