import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { ArrowLeft, TriangleAlert } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { TraceDetail } from "@/components/conversations/trace-detail"
import { TurnTimeline } from "@/components/conversations/turn-timeline"
import { MeshJourney } from "@/components/conversations/mesh-journey"
import { ReplayCard } from "@/components/conversations/replay-card"
import { ReplayProvider } from "@/components/conversations/replay-provider"
import { RunAgainPanel } from "@/components/conversations/run-again-panel"
import { GradingPanel } from "@/components/conversations/grading-panel"
import { PersonaStateCard } from "@/components/conversations/persona-state-card"
import { FactsCard } from "@/components/conversations/facts-card"
import { SessionNav } from "@/components/conversations/session-nav"
import { RawTrace } from "@/components/conversations/raw-trace"
import { getInteractionFn, getTurnEventsFn } from "@/server/conversations"
import { listRunTargetsFn } from "@/server/fleet"
import { formatTs } from "@/utils/format"
import { getIncompleteReason } from "@/utils/conversation-status"
import { m } from "@/paraglide/messages"
import type { UserMoodSnapshot } from "@/types/conversations"

export const Route = createFileRoute("/_dashboard/conversations/$id")({
	loader: async ({ params }) => {
		const [detail, turnEvents] = await Promise.all([
			getInteractionFn({ data: params.id }),
			getTurnEventsFn({ data: params.id }),
		])
		if (!detail) throw notFound()
		const runTargets = await listRunTargetsFn({
			data: detail.trace.sourceDomiaKey,
		})
		return { detail, runTargets, turnEvents }
	},
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.route_conversation() }) }],
	}),
	component: ConversationPage,
})

function ConversationPage() {
	const { detail, runTargets, turnEvents } = Route.useLoaderData()
	const { trace, domiaName, domiaAvatarId, label, inputAudio, ttsAudio } =
		detail
	const name = domiaName ?? trace.sourceDomiaKey
	const userMood = trace.userEmotionSnapshot as UserMoodSnapshot | null
	const failed =
		!trace.llmResponse || (trace.inputType === "VOICE" && !trace.sttResult)
	const incomplete = getIncompleteReason(trace)

	return (
		<div className="space-y-6">
			<Link
				to="/conversations"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeft className="size-4" />
				{m.nav_conversations()}
			</Link>

			<div className="flex flex-wrap items-center gap-3">
				<PersonaAvatar
					domiaKey={trace.sourceDomiaKey}
					name={name}
					avatarId={domiaAvatarId}
					size="lg"
				/>
				<div>
					<Link
						to="/domias/$key"
						params={{ key: trace.sourceDomiaKey }}
						className="text-xl font-semibold tracking-tight hover:underline"
					>
						{name}
					</Link>
					<p className="text-muted-foreground text-sm">
						{formatTs(trace.createdAt)} · session {trace.sessionId ?? "—"}
					</p>
				</div>
				<div className="ml-auto flex flex-wrap items-center gap-3">
					{detail.adjacent && trace.interactionSessionTraceId && (
						<SessionNav
							adjacent={detail.adjacent}
							sessionId={trace.interactionSessionTraceId}
						/>
					)}
					<div className="flex flex-wrap gap-2">
						{failed && (
							<Badge variant="destructive">
								{!trace.sttResult && trace.inputType === "VOICE"
									? "Empty transcription"
									: "No LLM response"}
							</Badge>
						)}
						{trace.inputType && (
							<Badge variant="outline">{trace.inputType}</Badge>
						)}
						{trace.responseType && (
							<Badge variant="secondary">{trace.responseType}</Badge>
						)}
					</div>
				</div>
			</div>

			<ReplayProvider>
				<div className="grid items-start gap-6 lg:grid-cols-3">
					<div className="min-w-0 space-y-6 lg:col-span-2">
						<Card>
							<CardHeader className="gap-3">
								<CardTitle className="text-base">{m.conv_pipeline()}</CardTitle>
								<MeshJourney trace={trace} originKey={trace.sourceDomiaKey} />
							</CardHeader>
							<CardContent>
								{incomplete && (
									<div className="mb-4 flex gap-3 rounded-lg border border-amber-300/60 bg-amber-50 p-3 text-sm dark:border-amber-900/50 dark:bg-amber-950/30">
										<TriangleAlert className="size-4 shrink-0 translate-y-0.5 text-amber-600 dark:text-amber-400" />
										<div className="min-w-0">
											<p className="font-medium text-amber-900 dark:text-amber-200">
												{incomplete.title}
											</p>
											<p className="mt-0.5 text-amber-800/80 dark:text-amber-200/70">
												{incomplete.detail}
											</p>
										</div>
									</div>
								)}
								<TraceDetail detail={detail} />
							</CardContent>
						</Card>
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									{m.conv_timeline_title()}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<TurnTimeline
									events={turnEvents}
									originKey={trace.sourceDomiaKey}
								/>
							</CardContent>
						</Card>
						<RawTrace trace={trace} />
					</div>

					<div className="space-y-6">
						<ReplayCard
							trace={trace}
							inputSrc={inputAudio ? `/api/audio/${trace.id}?kind=input` : null}
							ttsSrc={ttsAudio ? `/api/audio/${trace.id}?kind=tts` : null}
						/>
						{runTargets.length > 0 && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										{m.conv_run_again()}
									</CardTitle>
								</CardHeader>
								<CardContent>
									<RunAgainPanel
										sourceInteractionId={trace.id}
										originKey={trace.sourceDomiaKey}
										targets={runTargets}
										originalReply={trace.llmResponse}
										originalTrace={trace}
									/>
								</CardContent>
							</Card>
						)}
						<Card>
							<CardHeader>
								<CardTitle className="text-base">
									{m.conv_evaluation()}
								</CardTitle>
							</CardHeader>
							<CardContent>
								<GradingPanel interactionId={trace.id} initial={label} />
							</CardContent>
						</Card>
						<PersonaStateCard trace={trace} />
						<FactsCard facts={detail.memoryFacts} />
						{userMood?.primary && (
							<Card>
								<CardHeader>
									<CardTitle className="text-base">
										{m.conv_user_signal()}
									</CardTitle>
								</CardHeader>
								<CardContent className="space-y-1">
									<p className="text-sm font-medium">{userMood.primary}</p>
									{userMood.note && (
										<p className="text-muted-foreground text-sm">
											{userMood.note}
										</p>
									)}
								</CardContent>
							</Card>
						)}
					</div>
				</div>
			</ReplayProvider>
		</div>
	)
}
