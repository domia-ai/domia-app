import { Link } from "@tanstack/react-router"
import { ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { relativeTime } from "@/utils/format"
import { ConfidenceBar } from "./confidence-bar"
import type { MemoryFactRow } from "@/types/memories"

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
				<div className="flex items-center justify-between border-t pt-3">
					<ConfidenceBar value={row.confidence ?? 0} />
					{row.sourceInteractionId ? (
						<Link
							to="/conversations/$id"
							params={{ id: row.sourceInteractionId }}
							className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
						>
							trace <ExternalLink className="size-3" />
						</Link>
					) : null}
				</div>
			</CardContent>
		</Card>
	)
}
