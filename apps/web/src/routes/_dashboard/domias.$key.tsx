import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { ArrowLeft, MessageSquareText, SlidersHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	CapabilitiesCard,
	EnginesCard,
	ModulesCard,
	MoodCard,
	PersonaCard,
	SkillsCard,
} from "@/components/domia/detail-sections"
import { PerformanceCard } from "@/components/domia/performance-card"
import { RestartButton } from "@/components/domia/restart-button"
import { RoleBadge } from "@/components/fleet/columns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
	getDomiaFn,
	getDomiaPerformanceFn,
	getRecentInteractionsFn,
} from "@/server/domia"
import { getDomiaRoleFn } from "@/server/fleet"
import { parseConfigSnapshot } from "@/utils/config"
import { accentFor } from "@/utils/accent"
import { isOnline } from "@/utils/presence"
import { relativeTime, formatMs } from "@/utils/format"
import { deriveFlow } from "@/utils/flow"
import { effectiveTtfa } from "@/utils/metrics"
import { FLOWS } from "@/constants/conversations"
import { cn } from "@/lib/utils"

const FLOW_BY_KEY = Object.fromEntries(FLOWS.map((f) => [f.key, f]))

export const Route = createFileRoute("/_dashboard/domias/$key")({
	loader: async ({ params }) => {
		const domia = await getDomiaFn({ data: params.key })
		if (!domia) throw notFound()
		const [recent, performance, role] = await Promise.all([
			getRecentInteractionsFn({ data: params.key }),
			getDomiaPerformanceFn({ data: params.key }),
			getDomiaRoleFn({ data: params.key }),
		])
		return { domia, recent, performance, role }
	},
	head: ({ loaderData }) => ({
		meta: [{ title: `${loaderData?.domia.name ?? "Domia"} | Domia Console` }],
	}),
	component: DomiaDetailPage,
})

function DomiaDetailPage() {
	const { domia, recent, performance, role } = Route.useLoaderData()
	const config = parseConfigSnapshot(domia.configSnapshotJson)
	const accent = accentFor(domia.domiaKey)
	const online = isOnline(domia.lastSeenAt)
	const address = domia.localIp ? `${domia.localIp}:${domia.httpPort}` : "—"

	return (
		<div className="space-y-6">
			<Link
				to="/domias"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeft className="size-4" />
				Domias
			</Link>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<div
					className="text-background flex size-11 items-center justify-center rounded-full text-lg font-semibold"
					style={{ backgroundColor: accent }}
					aria-hidden="true"
				>
					{domia.name.charAt(0)}
				</div>
				<div className="space-y-1">
					<div className="flex items-center gap-2.5">
						<h1 className="text-2xl font-semibold tracking-tight">
							{domia.name}
						</h1>
						<div className="flex items-center gap-1.5">
							<span
								className={cn(
									"size-2 rounded-full",
									online ? "bg-emerald-500" : "bg-muted-foreground/40",
								)}
							/>
							<span className="text-muted-foreground text-sm">
								{online ? "Online" : "Offline"}
							</span>
							<span className="text-muted-foreground/40">·</span>
							<RoleBadge role={role} />
						</div>
					</div>
					<div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
						<Badge variant="secondary" className="font-mono text-xs">
							{domia.domiaKey}
						</Badge>
						<span className="font-mono text-xs">{address}</span>
						<span>·</span>
						<span>{domia.isActive ? "Config-active" : "Config-inactive"}</span>
						<span>·</span>
						<span>
							Last interaction {relativeTime(domia.lastInteractionAt)}
						</span>
					</div>
				</div>
				<div className="ml-auto flex items-center gap-2">
					<Button
						variant="outline"
						nativeButton={false}
						render={
							<Link to="/domias/$key/config" params={{ key: domia.domiaKey }} />
						}
					>
						<SlidersHorizontal className="size-4" />
						Configure
					</Button>
					<RestartButton
						domiaKey={domia.domiaKey}
						domiaName={domia.name}
						online={online}
					/>
					<Button
						nativeButton={false}
						render={<Link to="/chat" search={{ domia: domia.domiaKey }} />}
					>
						<MessageSquareText className="size-4" />
						Talk to this Domia
					</Button>
				</div>
			</div>

			<div className="grid gap-5 lg:grid-cols-3">
				<div className="space-y-5 lg:col-span-2">
					<PerformanceCard data={performance} />
					{config.characterProfile && (
						<PersonaCard profile={config.characterProfile} />
					)}
					<EnginesCard
						llm={config.llmModelConfig}
						tts={config.ttsConfig}
						stt={config.sttConfig}
						wakeword={config.wakeWordConfig}
					/>
					{config.moduleSettings && (
						<ModulesCard modules={config.moduleSettings} />
					)}
				</div>

				<div className="space-y-5">
					{config.emotionState && (
						<MoodCard emotion={config.emotionState} accent={accent} />
					)}
					{config.runtimeCapabilities && (
						<CapabilitiesCard
							capabilities={config.runtimeCapabilities}
							delegations={config.capabilityDelegations}
						/>
					)}
					<SkillsCard servers={config.mcpServerConfigs} />

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Recent interactions</CardTitle>
						</CardHeader>
						<CardContent>
							{recent.length ? (
								<ul className="space-y-3">
									{recent.map((trace) => {
										const flow =
											FLOW_BY_KEY[
												deriveFlow(trace.inputType, trace.responseType)
											]
										const ttfa = effectiveTtfa(trace)
										return (
											<li key={trace.id} className="space-y-1 text-sm">
												<Link
													to="/conversations/$id"
													params={{ id: trace.id }}
													className="hover:text-primary line-clamp-2 font-medium transition-colors"
												>
													{trace.sttResult ?? trace.inputRaw ?? "—"}
												</Link>
												{trace.llmResponse && (
													<p className="text-muted-foreground line-clamp-2">
														↳ {trace.llmResponse}
													</p>
												)}
												<div className="text-muted-foreground flex items-center gap-2 text-xs">
													{flow && (
														<Badge
															variant="secondary"
															className="gap-1.5 text-[10px]"
														>
															<span
																className={cn(
																	"size-1.5 rounded-full",
																	flow.className,
																)}
															/>
															{flow.key.toUpperCase()}
														</Badge>
													)}
													{ttfa > 0 && (
														<span className="font-mono tabular-nums">
															{formatMs(ttfa)}
														</span>
													)}
													<span>·</span>
													<span>{relativeTime(trace.createdAt)}</span>
												</div>
											</li>
										)
									})}
								</ul>
							) : (
								<p className="text-muted-foreground text-sm">
									No interactions recorded yet.
								</p>
							)}
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
