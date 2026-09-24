import { Link } from "@tanstack/react-router"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { useDataQuery } from "@/hooks/use-query-state"
import { listUserModelsFn } from "@/server/memories"
import { relativeTime } from "@/utils/format"
import type { UserModelView as UserModelRow } from "@/types/memories"

function TagList({
	label,
	values,
}: {
	label: string
	values: string[] | null
}) {
	const clean = [
		...new Set((values ?? []).map((v) => v.trim()).filter(Boolean)),
	]
	if (clean.length === 0) return null
	return (
		<div className="space-y-1.5">
			<p className="text-muted-foreground text-xs font-medium uppercase">
				{label}
			</p>
			<div className="flex flex-wrap gap-1.5">
				{clean.map((value) => (
					<Badge key={value} variant="secondary" className="text-[10px]">
						{value}
					</Badge>
				))}
			</div>
		</div>
	)
}

function UserModelCard({ row }: { row: UserModelRow }) {
	const name = row.domiaName ?? row.sourceDomiaKey
	return (
		<Card className="h-full">
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
					{relativeTime(row.updatedAt)}
				</span>
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-sm leading-relaxed">
					{row.summary ?? m.mem_user_model_no_summary()}
				</p>
				{row.moodTendencies ? (
					<p className="text-muted-foreground text-xs">
						{m.mem_user_model_mood()} {row.moodTendencies}
					</p>
				) : null}
				<TagList label={m.mem_user_model_interests()} values={row.interests} />
				<TagList label={m.mem_user_model_prefs()} values={row.prefs} />
				<div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 border-t pt-3 text-xs tabular-nums">
					<span>
						{m.mem_user_model_familiarity({
							count: Math.round(row.familiarity ?? 0),
						})}
					</span>
					<span>{m.mem_user_model_facts({ count: row.factCount })}</span>
					<span>{m.mem_user_model_episodes({ count: row.episodeCount })}</span>
				</div>
			</CardContent>
		</Card>
	)
}

export function UserModelView() {
	const { state } = useDataQuery({
		queryKey: ["user-models"],
		queryFn: () => listUserModelsFn(),
		errorMessage: m.mem_user_model_load_failed,
	})

	return (
		<AsyncBoundary
			state={state}
			skeleton={
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} className="h-52 w-full" />
					))}
				</div>
			}
		>
			{(rows) =>
				rows.length ? (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{rows.map((row) => (
							<UserModelCard key={row.sourceDomiaKey} row={row} />
						))}
					</div>
				) : (
					<div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
						{m.mem_user_model_empty_hint()}
					</div>
				)
			}
		</AsyncBoundary>
	)
}
