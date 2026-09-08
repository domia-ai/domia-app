import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Sparkles, WandSparkles } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { setupCandidatesQueryOptions } from "@/server/setup"
import type { SetupReason } from "@/types/setup"

const REASON_LABELS: Record<SetupReason, () => string> = {
	"default-name": m.setup_reason_default_name,
	"no-persona": m.setup_reason_no_persona,
	"no-capabilities": m.setup_reason_no_capabilities,
}

export function FirstRunBanner() {
	const query = useQuery(setupCandidatesQueryOptions())

	if (query.isLoading)
		return (
			<div className="space-y-3 rounded-lg border px-4 py-3">
				<Skeleton className="h-4 w-48" />
				<Skeleton className="h-10 w-full" />
			</div>
		)
	if (query.isError)
		return (
			<p className="text-muted-foreground text-xs">
				{m.setup_candidates_failed()}
			</p>
		)
	const candidates = query.data ?? []
	if (candidates.length === 0) return null

	return (
		<div className="border-primary/30 bg-primary/5 space-y-3 rounded-lg border px-4 py-3">
			<div className="flex items-center gap-2">
				<WandSparkles className="text-primary size-4" />
				<p className="text-sm font-medium">
					{m.setup_banner_title({ count: candidates.length })}
				</p>
			</div>
			<p className="text-muted-foreground text-xs">{m.setup_banner_desc()}</p>
			<div className="flex flex-col gap-2">
				{candidates.map((c) => (
					<div
						key={c.domiaKey}
						className="bg-background flex flex-wrap items-center gap-2 rounded-md border px-3 py-2"
					>
						<span className="text-sm font-medium">{c.name}</span>
						<span className="text-muted-foreground font-mono text-xs">
							{c.localIp ? `${c.localIp}:${c.httpPort ?? ""}` : c.domiaKey}
						</span>
						{c.reasons.map((r) => (
							<Badge key={r} variant="outline" className="text-[10px]">
								{REASON_LABELS[r]()}
							</Badge>
						))}
						{!c.online && (
							<Badge variant="secondary" className="text-[10px]">
								{m.setup_offline()}
							</Badge>
						)}
						<Button
							size="sm"
							className="ml-auto"
							disabled={!c.online}
							nativeButton={false}
							render={
								<Link
									to="/setup"
									search={{ domia: c.domiaKey, step: undefined }}
								/>
							}
						>
							<Sparkles className="size-3.5" />
							{m.setup_start()}
						</Button>
					</div>
				))}
			</div>
		</div>
	)
}
