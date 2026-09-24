import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
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
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { useActionQuery, useDataQuery } from "@/hooks/use-query-state"
import { broadcastTargetsQueryOptions } from "@/server/broadcast"
import { recentAnnouncementsQueryOptions } from "@/server/announcements"
import { relativeTime } from "@/utils/format"
import { cn } from "@/lib/utils"
import type {
	RecentBroadcast,
	RecentBroadcastsProps,
	BroadcastPanelsProps,
	BroadcastViewProps,
} from "@/types/broadcast"

const announceAudioSrc = (entry: RecentBroadcast): string => {
	const domiaKey = entry.targets[0]?.domiaKey
	return domiaKey
		? `/api/node-audio?domia=${encodeURIComponent(domiaKey)}&id=${encodeURIComponent(entry.audioId ?? "")}&kind=announce`
		: `/api/audio/${entry.audioId}?kind=announce`
}

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
								src={announceAudioSrc(entry)}
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

function BroadcastPanels({ data, initialTarget }: BroadcastPanelsProps) {
	const { state: recentState } = useDataQuery({
		...recentAnnouncementsQueryOptions(),
		errorMessage: m.broadcast_recent_error,
	})
	const qc = useQueryClient()
	const [intercomNode, setIntercomNode] = useState("")

	if (data.total === 0)
		return (
			<div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center text-sm">
				<Megaphone className="size-8 opacity-40" />
				<p>{m.settings_no_domias()}</p>
			</div>
		)

	const { targets, intercomNodes, presence } = data
	const unavailable = presence === "unavailable"
	const activeNode = intercomNode || intercomNodes[0]?.nodeId || ""
	const intercomTarget = intercomNodes.find((n) => n.nodeId === activeNode)
	const nameOfNode = (id: string) =>
		intercomNodes.find((n) => n.nodeId === id)?.nodeName ?? id

	const onSent = () =>
		void qc.invalidateQueries({ queryKey: ["recent-announcements"] })

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
							{unavailable ? null : (
								<p className="text-muted-foreground text-xs font-medium uppercase">
									{m.broadcast_targets_count({ count: targets.length })}
								</p>
							)}
						</CardHeader>
						<CardContent>
							{unavailable ? (
								<p className="text-muted-foreground py-10 text-center text-sm">
									{m.broadcast_presence_unavailable()}
								</p>
							) : (
								<AnnounceControl
									domias={targets}
									onSent={onSent}
									initialTarget={initialTarget}
								/>
							)}
						</CardContent>
					</Card>

					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle className="text-base">
								{m.broadcast_recent_title()}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<AsyncBoundary
								state={recentState}
								skeleton={
									<p className="text-muted-foreground py-10 text-center text-sm">
										{m.cmd_loading()}
									</p>
								}
							>
								{(list) => <RecentBroadcasts list={list} />}
							</AsyncBoundary>
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
						{unavailable ? (
							<p className="text-muted-foreground py-6 text-center text-sm">
								{m.broadcast_presence_unavailable()}
							</p>
						) : intercomNodes.length === 0 ? (
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
											{intercomNodes.map((n) => (
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

export function BroadcastView({ initialTarget }: BroadcastViewProps) {
	const { state } = useActionQuery({
		...broadcastTargetsQueryOptions(),
		errorMessage: m.broadcast_load_error,
	})

	return (
		<AsyncBoundary
			state={state}
			skeleton={
				<p className="text-muted-foreground text-sm">{m.cmd_loading()}</p>
			}
		>
			{(data) =>
				data ? (
					<BroadcastPanels data={data} initialTarget={initialTarget} />
				) : null
			}
		</AsyncBoundary>
	)
}
