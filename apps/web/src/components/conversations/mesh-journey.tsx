import { ArrowRight } from "lucide-react"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { Badge } from "@/components/ui/badge"
import { buildJourney, humanizeDomiaKey } from "@/utils/journey"
import type { LatencyStepKey, MeshJourneyProps } from "@/types/conversations"

const STEP_LABEL: Record<LatencyStepKey, string> = {
	stt: "STT",
	llm: "LLM",
	tts: "TTS",
}

export function MeshJourney({ trace, originKey }: MeshJourneyProps) {
	const journey = buildJourney(trace, originKey)
	if (journey.length === 0) return null

	const originName = humanizeDomiaKey(originKey)
	const remote = journey.filter((s) => !s.local)

	if (remote.length === 0) {
		return (
			<div className="text-muted-foreground flex items-center gap-2 text-xs">
				<PersonaAvatar domiaKey={originKey} name={originName} size="sm" />
				<span className="text-foreground font-medium">{originName}</span>
				ran the full pipeline locally
			</div>
		)
	}

	const byExecutor = new Map<string, { name: string; steps: string[] }>()
	for (const s of remote) {
		const entry = byExecutor.get(s.executorKey) ?? {
			name: s.executorName,
			steps: [],
		}
		entry.steps.push(STEP_LABEL[s.step])
		byExecutor.set(s.executorKey, entry)
	}

	return (
		<div className="flex flex-wrap items-center gap-2 text-sm">
			<span className="flex items-center gap-1.5">
				<PersonaAvatar domiaKey={originKey} name={originName} size="sm" />
				<span className="font-medium">{originName}</span>
			</span>
			{[...byExecutor.entries()].map(([key, entry]) => (
				<span key={key} className="flex items-center gap-1.5">
					<ArrowRight className="text-muted-foreground size-4" />
					<PersonaAvatar domiaKey={key} name={entry.name} size="sm" />
					<span className="font-medium">{entry.name}</span>
					<span className="flex gap-1">
						{entry.steps.map((step) => (
							<Badge
								key={step}
								variant="secondary"
								className="px-1.5 py-0 text-[10px]"
							>
								{step}
							</Badge>
						))}
					</span>
				</span>
			))}
			<ArrowRight className="text-muted-foreground size-4" />
			<PersonaAvatar domiaKey={originKey} name={originName} size="sm" />
		</div>
	)
}
