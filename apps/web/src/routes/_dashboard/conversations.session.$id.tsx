import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { ArrowLeft, Layers } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { SessionThread } from "@/components/conversations/session-thread"
import { getSessionTurnsFn } from "@/server/conversations"
import { formatTs } from "@/utils/format"

export const Route = createFileRoute("/_dashboard/conversations/session/$id")({
	loader: async ({ params }) => {
		const detail = await getSessionTurnsFn({ data: params.id })
		if (!detail) throw notFound()
		return detail
	},
	head: () => ({ meta: [{ title: "Session | Domia Console" }] }),
	component: SessionPage,
})

function SessionPage() {
	const detail = Route.useLoaderData()
	const { session, domiaName, domiaAvatarId, turns } = detail
	const name = domiaName ?? session.sourceDomiaKey

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
				<PersonaAvatar
					domiaKey={session.sourceDomiaKey}
					name={name}
					avatarId={domiaAvatarId}
					size="lg"
				/>
				<div>
					<Link
						to="/domias/$key"
						params={{ key: session.sourceDomiaKey }}
						className="text-xl font-semibold tracking-tight hover:underline"
					>
						{name}
					</Link>
					<p className="text-muted-foreground text-sm">
						Session {session.sessionId ?? "—"} · started{" "}
						{formatTs(session.startedAt ?? session.createdAt)}
					</p>
				</div>
				<Badge variant="outline" className="ml-auto gap-1">
					<Layers className="size-3" />
					{turns.length} turns
				</Badge>
			</div>

			<SessionThread detail={detail} />
		</div>
	)
}
