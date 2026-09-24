import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { ExternalLink } from "lucide-react"
import { m } from "@/paraglide/messages"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { relativeTime } from "@/utils/format"
import { EpisodeTopics } from "./episode-card"
import type { MemoryEpisodeRow } from "@/types/memories"

export const episodeColumns: ColumnDef<MemoryEpisodeRow>[] = [
	{
		id: "domia",
		header: () => m.mem_col_domia(),
		enableSorting: false,
		cell: ({ row }) => {
			const r = row.original
			const name = r.domiaName ?? r.sourceDomiaKey
			return (
				<Link
					to="/domias/$key"
					params={{ key: r.sourceDomiaKey }}
					onClick={(e) => e.stopPropagation()}
					className="flex items-center gap-2.5 hover:underline"
				>
					<PersonaAvatar
						domiaKey={r.sourceDomiaKey}
						name={name}
						avatarId={r.domiaAvatarId}
						size="sm"
					/>
					<span className="font-medium">{name}</span>
				</Link>
			)
		},
	},
	{
		id: "summary",
		header: () => m.mem_col_episode_summary(),
		enableSorting: false,
		cell: ({ row }) => (
			<div className="max-w-md space-y-1">
				<p className="text-sm">
					{row.original.summary ?? m.mem_episode_no_summary()}
				</p>
				<EpisodeTopics topics={row.original.topics} />
			</div>
		),
	},
	{
		id: "moodArc",
		header: () => m.mem_col_episode_mood(),
		enableSorting: false,
		cell: ({ row }) => (
			<span className="text-muted-foreground text-sm">
				{row.original.moodArc || "—"}
			</span>
		),
	},
	{
		id: "turns",
		header: () => m.mem_col_episode_turns(),
		enableSorting: false,
		cell: ({ row }) =>
			row.original.sessionTraceId ? (
				<Link
					to="/conversations/session/$id"
					params={{ id: row.original.sessionTraceId }}
					onClick={(e) => e.stopPropagation()}
					className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
				>
					{m.mem_episode_turns({ count: row.original.turnCount })}
					<ExternalLink className="size-3" />
				</Link>
			) : (
				<span className="text-muted-foreground text-xs tabular-nums">
					{m.mem_episode_turns({ count: row.original.turnCount })}
				</span>
			),
	},
	{
		id: "createdAt",
		header: () => m.mem_col_episode_created(),
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{relativeTime(row.original.createdAt)}
			</span>
		),
	},
]
