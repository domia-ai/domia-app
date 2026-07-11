import { useEffect, useRef, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Room, RoomEvent, Track } from "livekit-client"
import type { RemoteTrack } from "livekit-client"
import { Mic, PhoneOff, Radio } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { getLivekitTokenFn } from "@/server/livekit"
import { satellitesQueryOptions } from "@/server/satellites"
import type { MeshDomiaRow } from "@/types/fleet"
import type { LivekitLabStatus, LivekitLabLogEntry } from "@/types/satellites"

const statusVariant = (
	status: LivekitLabStatus,
): "default" | "secondary" | "destructive" => {
	if (status === "connected") return "default"
	if (status === "error") return "destructive"
	return "secondary"
}

export const LivekitLab = ({ domias }: { domias: MeshDomiaRow[] }) => {
	const [selectedKey, setSelectedKey] = useState(domias[0]?.domiaKey ?? "")
	const [satelliteId, setSatelliteId] = useState<string | null>(null)
	const [status, setStatus] = useState<LivekitLabStatus>("idle")
	const [log, setLog] = useState<LivekitLabLogEntry[]>([])
	const [domiaSpeaking, setDomiaSpeaking] = useState(false)
	const [micActive, setMicActive] = useState(false)
	const roomRef = useRef<Room | null>(null)
	const audioHostRef = useRef<HTMLDivElement | null>(null)

	const satellitesQuery = useQuery({
		...satellitesQueryOptions(selectedKey),
		enabled: Boolean(selectedKey),
	})
	const livekitSatellites = (
		satellitesQuery.data?.ok ? (satellitesQuery.data.data ?? []) : []
	).filter((s) => s.protocol === "livekit" && s.isActive)

	const appendLog = (kind: LivekitLabLogEntry["kind"], text: string): void =>
		setLog((prev) => [...prev.slice(-49), { at: Date.now(), kind, text }])

	const disconnect = (): void => {
		void roomRef.current?.disconnect()
		roomRef.current = null
		setStatus("idle")
		setDomiaSpeaking(false)
		setMicActive(false)
	}

	useEffect(
		() => () => {
			void roomRef.current?.disconnect()
		},
		[],
	)
	useEffect(() => {
		setSatelliteId(null)
		disconnect()
	}, [selectedKey])

	const connect = async (): Promise<void> => {
		if (!selectedKey || !satelliteId) return
		setStatus("connecting")
		setLog([])
		const grant = await getLivekitTokenFn({
			data: { domiaKey: selectedKey, satelliteId },
		})
		if (!grant.ok || !grant.data) {
			setStatus("error")
			appendLog("error", grant.ok ? "empty grant" : grant.error)
			return
		}
		const room = new Room()
		roomRef.current = room
		room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
			if (track.kind !== Track.Kind.Audio) return
			const element = track.attach()
			audioHostRef.current?.appendChild(element)
			appendLog("info", "domia-tts track subscribed")
		})
		room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
			track.detach().forEach((el) => el.remove())
		})
		room.on(RoomEvent.DataReceived, (payload, _participant, _kind, topic) => {
			const text = new TextDecoder().decode(payload)
			if (topic === "transcript") appendLog("transcript", text)
			else if (topic === "error") appendLog("error", text)
		})
		room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
			setDomiaSpeaking(speakers.some((s) => s.identity.startsWith("domia-")))
			setMicActive(speakers.some((s) => s === room.localParticipant))
		})
		room.on(RoomEvent.Disconnected, () => {
			appendLog("info", "room disconnected")
			setStatus("idle")
		})
		try {
			await room.connect(grant.data.url, grant.data.token)
			await room.localParticipant.setMicrophoneEnabled(true)
			setStatus("connected")
			appendLog("info", `joined ${grant.data.roomName} — speak now`)
		} catch (err) {
			setStatus("error")
			appendLog("error", err instanceof Error ? err.message : String(err))
			roomRef.current = null
		}
	}

	return (
		<div className="mx-auto max-w-3xl space-y-6">
			<Card>
				<CardHeader className="flex-row items-center justify-between space-y-0">
					<CardTitle className="flex items-center gap-2">
						<Radio className="size-4" />
						LiveKit voice lab
					</CardTitle>
					<Badge variant={statusVariant(status)}>{status}</Badge>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap items-end gap-3">
						<Select
							value={selectedKey}
							onValueChange={(v) => v && setSelectedKey(v)}
							items={domias.map((d) => ({
								value: d.domiaKey,
								label: `${d.name} (${d.domiaKey})`,
							}))}
						>
							<SelectTrigger className="h-9 w-52">
								<SelectValue placeholder="Domia" />
							</SelectTrigger>
							<SelectContent>
								{domias.map((d) => (
									<SelectItem key={d.domiaKey} value={d.domiaKey}>
										{`${d.name} (${d.domiaKey})`}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<Select
							value={satelliteId}
							onValueChange={(v) => v && setSatelliteId(v)}
							items={livekitSatellites.map((s) => ({
								value: s.satelliteId,
								label: s.name ?? s.satelliteId,
							}))}
						>
							<SelectTrigger className="h-9 w-52">
								<SelectValue placeholder="LiveKit room" />
							</SelectTrigger>
							<SelectContent>
								{livekitSatellites.map((s) => (
									<SelectItem key={s.satelliteId} value={s.satelliteId}>
										{s.name ?? s.satelliteId}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						{status === "connected" ? (
							<Button variant="destructive" onClick={disconnect}>
								<PhoneOff className="size-3.5" />
								Disconnect
							</Button>
						) : (
							<Button
								onClick={() => void connect()}
								disabled={
									!selectedKey || !satelliteId || status === "connecting"
								}
							>
								<Mic className="size-3.5" />
								{status === "connecting" ? "Connecting…" : "Connect"}
							</Button>
						)}
					</div>
					{satellitesQuery.isLoading && selectedKey ? (
						<p className="text-muted-foreground text-sm">Loading satellites…</p>
					) : null}
					{satellitesQuery.isError ? (
						<p className="text-destructive text-sm">
							Failed to load satellites for {selectedKey}.
						</p>
					) : null}
					{!satellitesQuery.isLoading &&
					selectedKey &&
					livekitSatellites.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No active LiveKit satellite bound to this Domia. Bind one with
							protocol "livekit" first.
						</p>
					) : null}
					{status === "connected" ? (
						<div className="flex items-center gap-4 text-sm">
							<span
								className={micActive ? "text-primary" : "text-muted-foreground"}
							>
								● you
							</span>
							<span
								className={
									domiaSpeaking ? "text-primary" : "text-muted-foreground"
								}
							>
								● domia
							</span>
						</div>
					) : null}
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardTitle>Transcript</CardTitle>
				</CardHeader>
				<CardContent>
					{log.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							Nothing yet — connect and talk.
						</p>
					) : (
						<ul className="space-y-1 font-mono text-sm">
							{log.map((entry) => (
								<li
									key={entry.at + entry.text}
									className={
										entry.kind === "error"
											? "text-destructive"
											: entry.kind === "info"
												? "text-muted-foreground"
												: ""
									}
								>
									{entry.text}
								</li>
							))}
						</ul>
					)}
				</CardContent>
			</Card>
			<div ref={audioHostRef} className="hidden" />
		</div>
	)
}
