import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Megaphone, Radio } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { AnnounceControl } from "@/components/live/announce-control"
import { IntercomControl } from "@/components/live/intercom-control"
import { domiaTargetsQueryOptions } from "@/server/fleet"
import { livePresenceQueryOptions } from "@/server/live"
import { relativeTimeMs } from "@/utils/format"
import type { AnnounceLogEntry } from "@/types/broadcast"

const ALL = "__all__"

export function BroadcastView() {
	const domias = useQuery(domiaTargetsQueryOptions())
	const presence = useQuery(livePresenceQueryOptions())
	const [target, setTarget] = useState(ALL)
	const [intercomNode, setIntercomNode] = useState("")
	const [recent, setRecent] = useState<AnnounceLogEntry[]>([])

	if (domias.isLoading)
		return <p className="text-muted-foreground text-sm">Loading…</p>
	if (domias.isError || !domias.data)
		return <p className="text-destructive text-sm">Could not load Domias.</p>

	const allDomias = domias.data
	if (allDomias.length === 0)
		return (
			<div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center text-sm">
				<Megaphone className="size-8 opacity-40" />
				<p>No Domias discovered yet.</p>
			</div>
		)

	const nameOfDomia = (key: string) =>
		allDomias.find((d) => d.domiaKey === key)?.name ?? key
	const announceTargets =
		target === ALL ? allDomias.map((d) => d.domiaKey) : [target]
	const targetLabel = target === ALL ? "every Domia" : nameOfDomia(target)

	const nodes = presence.data?.ok ? (presence.data.data ?? []) : []
	const intercomCandidates = nodes.filter((n) => n.rooms.length > 1)
	const activeNode = intercomNode || intercomCandidates[0]?.nodeId || ""
	const intercomTarget = nodes.find((n) => n.nodeId === activeNode)
	const nameOfNode = (id: string) =>
		nodes.find((n) => n.nodeId === id)?.nodeName ?? id

	const onSent = (text: string, delivered: number) =>
		setRecent((prev) =>
			[{ text, delivered, at: Date.now() }, ...prev].slice(0, 8),
		)

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<div className="space-y-4 lg:col-span-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Megaphone className="text-muted-foreground size-4" /> Announce
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="space-y-1.5">
							<p className="text-muted-foreground text-xs font-medium uppercase">
								Target
							</p>
							<Select value={target} onValueChange={(v) => setTarget(v ?? ALL)}>
								<SelectTrigger className="w-full">
									<SelectValue>
										{(value) =>
											value === ALL
												? "All Domias"
												: nameOfDomia(String(value ?? ""))
										}
									</SelectValue>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL}>All Domias</SelectItem>
									{allDomias.map((d) => (
										<SelectItem key={d.domiaKey} value={d.domiaKey}>
											{d.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<AnnounceControl
							targets={announceTargets}
							placeholder={`Announce to ${targetLabel}…`}
							onSent={onSent}
						/>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="text-base">Recently sent</CardTitle>
					</CardHeader>
					<CardContent>
						{recent.length === 0 ? (
							<p className="text-muted-foreground py-6 text-center text-sm">
								Announcements you send this session show up here.
							</p>
						) : (
							<ul className="space-y-2">
								{recent.map((entry) => (
									<li
										key={entry.at}
										className="flex items-start justify-between gap-3 border-b pb-2 text-sm last:border-0 last:pb-0"
									>
										<span className="flex-1">{entry.text}</span>
										<span className="text-muted-foreground shrink-0 text-xs tabular-nums">
											{entry.delivered} Domia(s) · {relativeTimeMs(entry.at)}
										</span>
									</li>
								))}
							</ul>
						)}
					</CardContent>
				</Card>
			</div>

			<Card className="h-fit">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-base">
						<Radio className="text-muted-foreground size-4" /> Intercom
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{intercomCandidates.length === 0 ? (
						<p className="text-muted-foreground py-6 text-center text-sm">
							Intercom needs a node hosting two or more rooms.
						</p>
					) : (
						<>
							<div className="space-y-1.5">
								<p className="text-muted-foreground text-xs font-medium uppercase">
									Node
								</p>
								<Select
									value={activeNode}
									onValueChange={(v) => setIntercomNode(v ?? "")}
								>
									<SelectTrigger className="w-full">
										<SelectValue>
											{(value) => nameOfNode(String(value ?? ""))}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										{intercomCandidates.map((n) => (
											<SelectItem key={n.nodeId} value={n.nodeId}>
												{n.nodeName}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							{intercomTarget ? (
								<IntercomControl
									key={activeNode}
									hostDomiaKey={intercomTarget.hostDomiaKey}
									rooms={intercomTarget.rooms}
								/>
							) : null}
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
