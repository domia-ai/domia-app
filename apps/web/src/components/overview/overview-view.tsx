import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Bar, BarChart, XAxis } from "recharts"
import {
	Activity,
	AlertTriangle,
	ArrowRight,
	Cpu,
	MessagesSquare,
	Network,
	Radio,
	Zap,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from "@/components/ui/chart"
import { Badge } from "@/components/ui/badge"
import { MeshMap } from "@/components/domia/mesh-map"
import { StatCard } from "@/components/domia/stat-card"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { StatusPill } from "@/components/domia/status"
import { CapabilityChips } from "@/components/domia/capability-chips"
import { MoodRadar } from "@/components/domia/mood-radar"
import { accentFor } from "@/utils/accent"
import { parseConfigSnapshot } from "@/utils/config"
import { isOnline } from "@/utils/presence"
import { relativeTime, relativeTimeMs, formatMs } from "@/utils/format"
import { cn } from "@/lib/utils"
import { FLOWS } from "@/constants/conversations"
import { useConsolePrefs } from "@/components/providers/console-prefs"
import { overviewQueryOptions } from "@/server/overview"
import type { CapabilityKey } from "@/types"

const FLOW_BY_KEY = Object.fromEntries(FLOWS.map((f) => [f.key, f]))

const activityConfig = {
	count: { label: "Interactions", color: "var(--chart-1)" },
} satisfies ChartConfig

export function OverviewView() {
	const { liveRefreshMs } = useConsolePrefs()
	const { data } = useSuspenseQuery({
		...overviewQueryOptions(),
		refetchInterval: liveRefreshMs,
	})

	const { rows, edges, stats, performance, recent, telemetry } = data
	const [selectedKey, setSelectedKey] = useState(rows[0]?.domiaKey ?? "")
	const selected =
		rows.find((r) => r.domiaKey === selectedKey) ?? rows[0] ?? null
	const config = selected
		? parseConfigSnapshot(selected.configSnapshotJson)
		: null
	const delegated = (config?.capabilityDelegations ?? []).map(
		(d) => d.capability.toLowerCase() as CapabilityKey,
	)
	const selectedTelemetry = selected ? telemetry[selected.domiaKey] : undefined
	const activity = performance.activity

	return (
		<div className="space-y-6">
			<section className="space-y-3">
				<h2 className="text-sm font-medium">Performance</h2>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<StatCard
						label="S2S first audio"
						value={formatMs(performance.s2sTtfaP50)}
						icon={Zap}
						hint={`p95 ${formatMs(performance.s2sTtfaP95)}`}
					/>
					<StatCard
						label="Local execution"
						value={
							performance.localExecPct == null
								? "—"
								: `${performance.localExecPct}%`
						}
						icon={Cpu}
						accent="success"
						hint="run on-device vs delegated"
					/>
					<StatCard
						label="Interactions"
						value={performance.volume24h}
						icon={MessagesSquare}
						hint="last 24h"
					/>
					<StatCard
						label="Error rate"
						value={`${performance.errorRate}%`}
						icon={AlertTriangle}
						accent={performance.errorRate > 0 ? "warning" : "muted"}
						hint="empty or failed replies"
					/>
				</div>
			</section>

			<section className="space-y-3">
				<h2 className="text-sm font-medium">Fleet</h2>
				<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
					<StatCard
						label="Discovered"
						value={stats.discovered}
						icon={Network}
					/>
					<StatCard
						label="Online now"
						value={stats.online}
						icon={Radio}
						accent="success"
						hint={`${stats.offline} offline`}
					/>
					<StatCard
						label="Active sessions"
						value={stats.activeSessions}
						icon={Activity}
						accent="warning"
						hint="last 30 min"
					/>
					<StatCard
						label="Conversations"
						value={stats.conversationsAllTime}
						icon={MessagesSquare}
						accent="muted"
						hint="all time"
					/>
				</div>
			</section>

			<div className="grid gap-6 lg:grid-cols-5">
				<Card className="lg:col-span-3">
					<CardHeader className="flex flex-row items-center justify-between">
						<CardTitle>Local mesh</CardTitle>
						<Link
							to="/domias"
							className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
						>
							All Domias <ArrowRight className="size-4" />
						</Link>
					</CardHeader>
					<CardContent>
						<MeshMap
							rows={rows}
							edges={edges}
							selectedKey={selectedKey}
							onSelect={setSelectedKey}
						/>
					</CardContent>
				</Card>

				{selected && config && (
					<Card className="lg:col-span-2">
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
										<StatusPill online={isOnline(selected.lastSeenAt)} />
									</div>
									<p className="text-muted-foreground text-sm">
										{config.characterProfile?.profession ??
											config.characterProfile?.name ??
											"—"}
									</p>
								</div>
							</div>
						</CardHeader>
						<CardContent className="space-y-4">
							{config.characterProfile?.personality && (
								<p className="text-muted-foreground text-sm leading-relaxed">
									{config.characterProfile.personality}
								</p>
							)}

							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-lg border p-3">
									<p className="text-muted-foreground text-xs">
										First audio p50
									</p>
									<p className="text-lg font-semibold tabular-nums">
										{formatMs(selectedTelemetry?.ttfaP50 ?? null)}
									</p>
								</div>
								<div className="rounded-lg border p-3">
									<p className="text-muted-foreground text-xs">Interactions</p>
									<p className="text-lg font-semibold tabular-nums">
										{selectedTelemetry?.count ?? 0}
									</p>
								</div>
							</div>

							<div>
								<p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
									Capabilities
								</p>
								<CapabilityChips
									capabilities={config.runtimeCapabilities}
									delegated={delegated}
									size="sm"
								/>
							</div>

							{config.emotionState && (
								<MoodRadar
									emotion={config.emotionState}
									accent={accentFor(selected.domiaKey)}
								/>
							)}

							<div className="grid grid-cols-2 gap-3 text-sm">
								<div>
									<p className="text-muted-foreground text-xs">Voice</p>
									<p className="font-medium">
										{config.ttsConfig?.voiceName ?? "—"}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Model</p>
									<p className="truncate font-medium">
										{config.llmModelConfig?.modelName ?? "—"}
									</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Local IP</p>
									<p className="font-mono text-xs">{selected.localIp ?? "—"}</p>
								</div>
								<div>
									<p className="text-muted-foreground text-xs">Last seen</p>
									<p className="font-medium">
										{relativeTimeMs(selected.lastSeenAt)}
									</p>
								</div>
							</div>

							<Link
								to="/domias/$key"
								params={{ key: selected.domiaKey }}
								className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors"
							>
								Open Domia <ArrowRight className="size-4" />
							</Link>
						</CardContent>
					</Card>
				)}
			</div>

			{activity.buckets.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle className="text-base">
							Activity · {activity.label}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ChartContainer config={activityConfig} className="h-32 w-full">
							<BarChart data={activity.buckets} accessibilityLayer>
								<XAxis
									dataKey="label"
									tickLine={false}
									axisLine={false}
									tickMargin={8}
									fontSize={11}
									interval="preserveStartEnd"
								/>
								<ChartTooltip content={<ChartTooltipContent />} />
								<Bar dataKey="count" fill="var(--color-count)" radius={3} />
							</BarChart>
						</ChartContainer>
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<CardTitle>Recent conversations</CardTitle>
					<Link
						to="/conversations"
						className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm transition-colors"
					>
						View all <ArrowRight className="size-4" />
					</Link>
				</CardHeader>
				<CardContent className="divide-border divide-y">
					{recent.length ? (
						recent.map((trace) => {
							const flow = FLOW_BY_KEY[trace.flow]
							return (
								<Link
									key={trace.id}
									to="/conversations/$id"
									params={{ id: trace.id }}
									className="hover:bg-muted/40 -mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors"
								>
									<PersonaAvatar
										domiaKey={trace.sourceDomiaKey}
										name={trace.sourceDomiaName ?? trace.sourceDomiaKey}
										avatarId={trace.sourceDomiaAvatarId}
										size="sm"
									/>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{trace.input}
										</p>
										<p className="text-muted-foreground truncate text-xs">
											{trace.reply ?? "—"}
										</p>
									</div>
									<div className="hidden shrink-0 items-center gap-2 sm:flex">
										{flow && (
											<Badge
												variant="secondary"
												className="gap-1.5 text-[11px]"
											>
												<span
													className={cn("size-2 rounded-full", flow.className)}
												/>
												{trace.flow.toUpperCase()}
											</Badge>
										)}
										{trace.delegated ? (
											<Network className="text-muted-foreground size-3.5" />
										) : (
											<Cpu className="text-muted-foreground size-3.5" />
										)}
									</div>
									<div className="shrink-0 text-right">
										<p className="font-mono text-xs font-medium tabular-nums">
											{formatMs(trace.ttfaMs)}
										</p>
										<p className="text-muted-foreground text-xs">
											{relativeTime(trace.createdAt)}
										</p>
									</div>
								</Link>
							)
						})
					) : (
						<p className="text-muted-foreground py-6 text-center text-sm">
							No conversations recorded yet.
						</p>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
