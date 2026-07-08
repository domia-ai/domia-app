import { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Megaphone, Radio, Mic, Type, Check, Clock, X } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { recentAnnouncementsQueryOptions } from "@/server/announcements"
import { relativeTime } from "@/utils/format"
import { cn } from "@/lib/utils"
import type {
	RecentBroadcast,
	RecentBroadcastsProps,
	BroadcastViewProps,
} from "@/types/broadcast"

function statusOf(entry: RecentBroadcast) {
	if (entry.total > 0 && entry.delivered === entry.total)
		return {
			icon: Check,
			label: m.broadcast_status_delivered(),
			cls: "bg-[var(--success)]/12 text-[var(--success)]",
		}
	if (entry.delivered > 0)
		return {
			icon: Clock,
			label: m.broadcast_status_partial(),
			cls: "bg-[var(--warning)]/12 text-[var(--warning)]",
		}
	return {
		icon: X,
		label: m.broadcast_status_failed(),
		cls: "bg-destructive/12 text-destructive",
	}
}

function RecentBroadcasts({ list }: RecentBroadcastsProps) {
	if (list.length === 0)
		return (
			<p className="text-muted-foreground py-10 text-center text-sm">
				{m.broadcast_recent_empty()}
			</p>
		)

	return (
		<div className="flex flex-col gap-3">
			{list.map((entry) => {
				const status = statusOf(entry)
				const StatusIcon = status.icon
				return (
					<div
						key={entry.broadcastId}
						className="border-border bg-muted/20 flex flex-col gap-2 rounded-lg border p-3"
					>
						<div className="flex items-start justify-between gap-2">
							<div className="flex min-w-0 items-center gap-1.5">
								{entry.kind === "audio" ? (
									<Mic className="text-muted-foreground size-3.5 shrink-0" />
								) : (
									<Type className="text-muted-foreground size-3.5 shrink-0" />
								)}
								<p className="truncate text-sm leading-snug font-medium">
									{entry.text || m.broadcast_voice_clip()}
								</p>
							</div>
							<span
								className={cn(
									"inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
									status.cls,
								)}
							>
								<StatusIcon className="size-3" />
								{entry.delivered}/{entry.total}
							</span>
						</div>

						<div className="flex flex-wrap items-center gap-1.5">
							{entry.targets.map((t) => (
								<span
									key={t.domiaKey}
									className={cn(
										"bg-muted rounded-md px-1.5 py-0.5 text-[11px]",
										t.delivered
											? "text-foreground"
											: "text-muted-foreground/60",
									)}
								>
									{t.name}
								</span>
							))}
						</div>

						{entry.audioId ? (
							<audio
								controls
								src={`/api/audio/${entry.audioId}?kind=announce`}
								className="h-8 w-full"
							/>
						) : null}

						<div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
							<span className="bg-muted rounded px-1.5 py-0.5">
								{entry.delivery === "original"
									? m.broadcast_original()
									: m.broadcast_domia_voice()}
							</span>
							<span>{relativeTime(entry.createdAt)}</span>
						</div>
					</div>
				)
			})}
		</div>
	)
}

export function BroadcastView({ initialTarget }: BroadcastViewProps) {
	const domias = useQuery(domiaTargetsQueryOptions())
	const presence = useQuery(livePresenceQueryOptions())
	const announcements = useQuery(recentAnnouncementsQueryOptions())
	const qc = useQueryClient()
	const [intercomNode, setIntercomNode] = useState("")

	if (domias.isLoading)
		return <p className="text-muted-foreground text-sm">{m.cmd_loading()}</p>
	if (domias.isError || !domias.data)
		return (
			<p className="text-destructive text-sm">{m.broadcast_load_error()}</p>
		)

	const allDomias = domias.data
	if (allDomias.length === 0)
		return (
			<div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center text-sm">
				<Megaphone className="size-8 opacity-40" />
				<p>{m.settings_no_domias()}</p>
			</div>
		)

	const nodes = presence.data?.ok ? (presence.data.data ?? []) : []
	const broadcastableKeys = new Set(
		nodes
			.flatMap((n) => n.rooms)
			.filter((r) => r.canBroadcast)
			.map((r) => r.domiaKey),
	)
	const broadcastTargets =
		presence.data?.ok === true
			? allDomias.filter((d) => broadcastableKeys.has(d.domiaKey))
			: allDomias
	const intercomCandidates = nodes.filter(
		(n) => n.rooms.filter((r) => r.canIntercom).length > 1,
	)
	const activeNode = intercomNode || intercomCandidates[0]?.nodeId || ""
	const intercomTarget = intercomCandidates.find((n) => n.nodeId === activeNode)
	const nameOfNode = (id: string) =>
		nodes.find((n) => n.nodeId === id)?.nodeName ?? id

	const onSent = () =>
		void qc.invalidateQueries({ queryKey: ["recent-announcements"] })

	const recent = announcements.data ?? []

	return (
		<Tabs defaultValue="broadcast" className="gap-6">
			<TabsList>
				<TabsTrigger value="broadcast">
					<Megaphone className="size-4" /> {m.nav_broadcast()}
				</TabsTrigger>
				<TabsTrigger value="intercom">
					<Radio className="size-4" /> {m.broadcast_tab_intercom()}
				</TabsTrigger>
			</TabsList>

			<TabsContent value="broadcast">
				<div className="grid gap-4 lg:grid-cols-5">
					<Card className="lg:col-span-3">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-base">
								<Megaphone className="text-muted-foreground size-4" />{" "}
								{m.broadcast_to_mesh()}
							</CardTitle>
							<p className="text-muted-foreground text-sm">
								{m.broadcast_to_mesh_desc()}
							</p>
						</CardHeader>
						<CardContent>
							<AnnounceControl
								domias={broadcastTargets}
								onSent={onSent}
								initialTarget={initialTarget}
							/>
						</CardContent>
					</Card>

					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="text-base">
								{m.broadcast_recent_title()}
							</CardTitle>
						</CardHeader>
						<CardContent>
							{announcements.isError ? (
								<p className="text-destructive py-10 text-center text-sm">
									{m.broadcast_recent_error()}
								</p>
							) : (
								<RecentBroadcasts list={recent} />
							)}
						</CardContent>
					</Card>
				</div>
			</TabsContent>

			<TabsContent value="intercom">
				<Card className="max-w-xl">
					<CardHeader>
						<CardTitle className="flex items-center gap-2 text-base">
							<Radio className="text-muted-foreground size-4" />{" "}
							{m.broadcast_tab_intercom()}
						</CardTitle>
						<p className="text-muted-foreground text-sm">
							{m.broadcast_intercom_desc()}
						</p>
					</CardHeader>
					<CardContent className="space-y-3">
						{intercomCandidates.length === 0 ? (
							<p className="text-muted-foreground py-6 text-center text-sm">
								{m.broadcast_intercom_needs()}
							</p>
						) : (
							<>
								<div className="space-y-1.5">
									<p className="text-muted-foreground text-xs font-medium uppercase">
										{m.route_node()}
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
										rooms={intercomTarget.rooms.filter((r) => r.canIntercom)}
									/>
								) : null}
							</>
						)}
					</CardContent>
				</Card>
			</TabsContent>
		</Tabs>
	)
}
