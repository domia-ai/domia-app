import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { formatTs } from "@/utils/format"
import type { FactBadgesProps } from "@/types/memories"

const SOURCE_KIND_LABELS: Record<string, () => string> = {
	stated: m.mem_source_stated,
	inferred: m.mem_source_inferred,
	imported: m.mem_source_imported,
}

export function FactBadges({ fact }: FactBadgesProps) {
	const endedAt = fact.validUntil ?? fact.supersededAt
	const sourceLabel = fact.sourceKind
		? SOURCE_KIND_LABELS[fact.sourceKind]
		: undefined

	if (!endedAt && !sourceLabel && !fact.personId) return null

	return (
		<div className="flex flex-wrap items-center gap-1.5">
			{endedAt && (
				<Badge
					variant="outline"
					title={m.mem_badge_formerly_since({ date: formatTs(endedAt) })}
				>
					{m.mem_badge_formerly()}
				</Badge>
			)}
			{sourceLabel && <Badge variant="ghost">{sourceLabel()}</Badge>}
			{fact.personId && (
				<Badge variant="ghost" title={m.mem_badge_person()}>
					{fact.personId}
				</Badge>
			)}
		</div>
	)
}
