import { Link } from "@tanstack/react-router"
import { ExternalLink, MessagesSquare } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { relativeTime } from "@/utils/format"
import type { EpisodeCardProps } from "@/types/memories"

const TOPIC_LIMIT = 8

const episodeTopics = (topics: string[] | null): string[] => [
	...new Set((topics ?? []).map((t) => t.trim()).filter(Boolean)),
]

export function EpisodeTopics({ topics }: { topics: string[] | null }) {
	const unique = episodeTopics(topics)
	if (unique.length === 0) return null
	const shown = unique.slice(0, TOPIC_LIMIT)
	const rest = unique.length - shown.length
	return (
		<div className="flex flex-wrap gap-1.5">
			{shown.map((topic) => (
				<Badge key={topic} variant="secondary" className="text-[10px]">
					{topic}
				</Badge>
			))}
			{rest > 0 && (
				<Badge variant="outline" className="text-muted-foreground text-[10px]">
					{m.mem_topics_more({ count: rest })}
				</Badge>
			)}
		</div>
	)
}

export function EpisodeCard({ row }: EpisodeCardProps) {
	const name = row.domiaName ?? row.sourceDomiaKey
	return (
		<Card className="hover:border-foreground/20 h-full transition-colors">
			<CardHeader className="flex-row items-center gap-3 space-y-0">
				<Link
					to="/domias/$key"
					params={{ key: row.sourceDomiaKey }}
					className="flex min-w-0 items-center gap-2.5 hover:underline"
				>
					<PersonaAvatar
						domiaKey={row.sourceDomiaKey}
						name={name}
						avatarId={row.domiaAvatarId}
						size="sm"
					/>
					<span className="truncate text-sm font-medium">{name}</span>
				</Link>
				<span className="text-muted-foreground ml-auto shrink-0 text-xs">
					{relativeTime(row.createdAt)}
				</span>
			</CardHeader>
			<CardContent className="space-y-3">
				<p className="text-sm leading-relaxed">
					{row.summary ?? m.mem_episode_no_summary()}
				</p>
				{row.moodArc ? (
					<p className="text-muted-foreground text-xs">
						{m.mem_episode_mood_arc()} {row.moodArc}
					</p>
				) : null}
				<EpisodeTopics topics={row.topics} />
				<div className="flex items-center justify-between border-t pt-3">
					<span className="text-muted-foreground inline-flex items-center gap-1.5 text-xs">
						<MessagesSquare className="size-3" />
						{m.mem_episode_turns({ count: row.turnCount })}
					</span>
					{row.sessionTraceId ? (
						<Link
							to="/conversations/session/$id"
							params={{ id: row.sessionTraceId }}
							className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
						>
							{m.mem_episode_session_link()}
							<ExternalLink className="size-3" />
						</Link>
					) : (
						<span className="text-muted-foreground font-mono text-[10px]">
							{row.sessionId ?? "—"}
						</span>
					)}
				</div>
			</CardContent>
		</Card>
	)
}
