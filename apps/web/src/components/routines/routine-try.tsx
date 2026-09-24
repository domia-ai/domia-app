import { useState } from "react"
import { Loader2, Play } from "lucide-react"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { tryFastPathFn } from "@/server/routines"
import { ROUTINE_TRY_MAX_CHARS } from "@/constants/routines"
import type {
	FastPathMissReason,
	MatchCardProps,
	RoutineTryProps,
} from "@/types/routines"

const MISS_LABELS: Record<FastPathMissReason, () => string> = {
	disabled: m.routine_try_miss_disabled,
	no_index: m.routine_try_miss_no_index,
	too_long: m.routine_try_miss_too_long,
	blocked_token: m.routine_try_miss_blocked_token,
	no_match: m.routine_try_miss_no_match,
	ambiguous: m.routine_try_miss_ambiguous,
	unavailable: m.routine_try_miss_unavailable,
}

function MatchCard({ match, expectedTool }: MatchCardProps) {
	return (
		<div className="border-border space-y-2 rounded-lg border p-3">
			<div className="flex flex-wrap items-center gap-2">
				<Badge
					variant={match.tool === expectedTool ? "default" : "secondary"}
					className="font-mono text-[11px]"
				>
					{match.namespacedName}
				</Badge>
				<span className="text-muted-foreground text-[11px]">
					{m.routine_try_coverage({
						percent: Math.round(match.coverage * 100),
					})}
				</span>
			</div>
			<div className="space-y-1 text-xs">
				<p className="text-muted-foreground">
					{m.routine_try_template()}{" "}
					<span className="text-foreground font-mono">{match.template}</span>
				</p>
				<p className="text-muted-foreground">
					{m.routine_try_args()}{" "}
					<span className="text-foreground font-mono">
						{JSON.stringify(match.resolvedArgs)}
					</span>
				</p>
			</div>
		</div>
	)
}

export function RoutineTry({
	domiaKey,
	expectedTool,
	disabled,
}: RoutineTryProps) {
	const [text, setText] = useState("")

	const attempt = useActionMutation({
		mutationFn: (phrase: string) =>
			tryFastPathFn({ data: { domiaKey, text: phrase } }),
		failureTitle: m.routine_try_failed,
	})

	const verdict = attempt.data?.ok ? attempt.data.data : undefined

	return (
		<section className="space-y-3">
			<div className="space-y-1">
				<h3 className="text-sm font-semibold">{m.routine_try_title()}</h3>
				<p className="text-muted-foreground text-xs">{m.routine_try_desc()}</p>
			</div>

			<div className="flex gap-2">
				<Input
					value={text}
					maxLength={ROUTINE_TRY_MAX_CHARS}
					placeholder={m.routine_try_placeholder()}
					onChange={(e) => setText(e.target.value)}
					onKeyDown={(e) => {
						if (e.key !== "Enter") return
						e.preventDefault()
						if (text.trim() && !disabled && !attempt.isPending)
							attempt.mutate(text.trim())
					}}
				/>
				<Button
					type="button"
					variant="outline"
					disabled={disabled || !text.trim() || attempt.isPending}
					onClick={() => attempt.mutate(text.trim())}
				>
					{attempt.isPending ? (
						<Loader2 className="size-4 animate-spin" />
					) : (
						<Play className="size-4" />
					)}
					{m.routine_try_run()}
				</Button>
			</div>

			{attempt.isPending ? (
				<p className="text-muted-foreground text-xs">
					{m.routine_try_running()}
				</p>
			) : attempt.isError ? (
				<p className="text-destructive text-xs">{m.routine_try_failed()}</p>
			) : attempt.data && !attempt.data.ok ? (
				<p className="text-destructive text-xs">
					{errText(attempt.data.error)}
				</p>
			) : verdict ? (
				<div className="space-y-2">
					<p className="text-muted-foreground text-[11px]">
						{m.routine_try_took({ ms: verdict.fastPathMs })}
					</p>
					{verdict.kind === "match" ? (
						<MatchCard match={verdict.match} expectedTool={expectedTool} />
					) : verdict.kind === "compound" ? (
						<div className="space-y-2">
							<p className="text-xs font-medium">
								{m.routine_try_compound({ count: verdict.matches.length })}
							</p>
							{verdict.matches.map((match, i) => (
								<MatchCard key={i} match={match} expectedTool={expectedTool} />
							))}
						</div>
					) : (
						<p className="text-muted-foreground border-border rounded-lg border border-dashed px-3 py-2 text-xs">
							{m.routine_try_miss({ reason: MISS_LABELS[verdict.reason]() })}
						</p>
					)}
				</div>
			) : null}
		</section>
	)
}
