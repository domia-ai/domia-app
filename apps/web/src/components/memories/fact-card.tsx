import { useState } from "react"
import { Link } from "@tanstack/react-router"
import { ChevronDown, ExternalLink } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { useDataQuery } from "@/hooks/use-query-state"
import { factEvidenceQueryOptions } from "@/server/memories"
import { relativeTime } from "@/utils/format"
import { ConfidenceBar } from "./confidence-bar"
import { FactBadges } from "./fact-badges"
import type { FactEvidenceProps, MemoryFactRow } from "@/types/memories"

export function FactEvidence({ factId, count }: FactEvidenceProps) {
	const [open, setOpen] = useState(false)
	const { state } = useDataQuery({
		...factEvidenceQueryOptions(factId),
		enabled: open,
		errorMessage: m.mem_evidence_error,
	})

	if (count <= 0) return null

	return (
		<Collapsible open={open} onOpenChange={setOpen}>
			<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-xs outline-none">
				<ChevronDown className="size-3 transition-transform group-data-[panel-open]:rotate-180" />
				{count === 1
					? m.mem_seen_in_conversations_one()
					: m.mem_seen_in_conversations({ count })}
			</CollapsibleTrigger>
			<CollapsibleContent className="pt-1.5">
				<AsyncBoundary
					state={state}
					skeleton={<Skeleton className="h-10 w-full" />}
				>
					{(links) =>
						links.length ? (
							<ul className="space-y-1">
								{links.map((link) =>
									link.mirrored ? (
										<li key={link.id}>
											<Link
												to="/conversations/$id"
												params={{ id: link.interactionId }}
												className="text-primary flex items-center gap-1.5 text-xs hover:underline"
											>
												<ExternalLink className="size-3 shrink-0" />
												<span className="truncate">
													{link.input ?? link.interactionId}
												</span>
												<span className="text-muted-foreground shrink-0">
													{relativeTime(link.createdAt)}
												</span>
											</Link>
										</li>
									) : (
										<li
											key={link.id}
											className="text-muted-foreground flex items-center gap-1.5 text-xs"
										>
											<span className="truncate font-mono">
												{link.interactionId}
											</span>
											<span className="shrink-0">
												{m.mem_evidence_not_mirrored()}
											</span>
										</li>
									),
								)}
							</ul>
						) : (
							<p className="text-muted-foreground text-xs">
								{m.mem_evidence_empty()}
							</p>
						)
					}
				</AsyncBoundary>
			</CollapsibleContent>
		</Collapsible>
	)
}

export function FactCard({ row }: { row: MemoryFactRow }) {
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
					{relativeTime(row.updatedAt)}
				</span>
			</CardHeader>
			<CardContent className="space-y-3">
				<p className="text-sm leading-relaxed">
					<span className="text-muted-foreground">{row.subject}</span>{" "}
					<span className="text-muted-foreground">{row.relation}</span>{" "}
					<span className="font-medium">{row.value}</span>
				</p>
				<FactBadges fact={row} />
				<FactEvidence factId={row.id} count={row.evidenceCount} />
				<div className="flex items-center justify-between border-t pt-3">
					<ConfidenceBar value={row.confidence ?? 0} />
					{row.sourceInteractionId ? (
						<Link
							to="/conversations/$id"
							params={{ id: row.sourceInteractionId }}
							className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
						>
							{m.mem_trace_link()} <ExternalLink className="size-3" />
						</Link>
					) : null}
				</div>
			</CardContent>
		</Card>
	)
}
