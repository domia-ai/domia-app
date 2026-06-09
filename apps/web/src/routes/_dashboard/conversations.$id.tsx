import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { TraceDetail } from "@/components/conversations/trace-detail"
import { MeshJourney } from "@/components/conversations/mesh-journey"
import { ReplayCard } from "@/components/conversations/replay-card"
import { ReplayProvider } from "@/components/conversations/replay-provider"
import { RunAgainPanel } from "@/components/conversations/run-again-panel"
import { GradingPanel } from "@/components/conversations/grading-panel"
import { PersonaStateCard } from "@/components/conversations/persona-state-card"
import { FactsCard } from "@/components/conversations/facts-card"
import { SessionNav } from "@/components/conversations/session-nav"
import { RawTrace } from "@/components/conversations/raw-trace"
import { getInteractionFn } from "@/server/conversations"
import { listRunTargetsFn } from "@/server/fleet"
import { formatTs } from "@/utils/format"
import type { UserMoodSnapshot } from "@/types/conversations"

export const Route = createFileRoute("/_dashboard/conversations/$id")({
	loader: async ({ params }) => {
		const detail = await getInteractionFn({ data: params.id })
		if (!detail) throw notFound()
		const runTargets = await listRunTargetsFn({
			data: detail.trace.sourceDomiaKey,
		})
		return { detail, runTargets }
	},
	head: () => ({ meta: [{ title: "Conversation | Domia Console" }] }),
	component: ConversationPage,
})

function ConversationPage() {
	const { detail, runTargets } = Route.useLoaderData()
	const { trace, domiaName, label, inputAudio, ttsAudio } = detail
	const name = domiaName ?? trace.sourceDomiaKey
	const userMood = trace.userEmotionSnapshot as UserMoodSnapshot | null
	const failed =
		!trace.llmResponse || (trace.inputType === "VOICE" && !trace.sttResult)

	return (
		<div className="space-y-6">
			<Link
				to="/conversations"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeft className="size-4" />
				Conversations
			</Link>

			<div className="flex flex-wrap items-center gap-3">
				<PersonaAvatar domiaKey={trace.sourceDomiaKey} name={name} size="lg" />
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
								<CardTitle className="text-base">Pipeline</CardTitle>
								<MeshJourney trace={trace} originKey={trace.sourceDomiaKey} />
							</CardHeader>
							<CardContent>
								<TraceDetail detail={detail} />
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
									<CardTitle className="text-base">Run again</CardTitle>
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
								<CardTitle className="text-base">Evaluation</CardTitle>
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
									<CardTitle className="text-base">User signal</CardTitle>
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
