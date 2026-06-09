import { Cpu } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { formatMs } from "@/utils/format"
import { useReplayState } from "./replay-provider"
import type { PipelineStep } from "@/types/conversations"

export function PipelineClient({ steps }: { steps: PipelineStep[] }) {
	const { activeStepKey, running } = useReplayState()

	return (
		<div className="space-y-5">
			{steps.map((step, i) => {
				const active = running && activeStepKey === step.key
				return (
					<div
						key={step.key}
						className={cn(
							"relative rounded-lg pl-10 transition-colors",
							active && "bg-primary/5",
						)}
					>
						<span
							className={cn(
								"bg-card absolute top-0 left-0 flex size-7 items-center justify-center rounded-full border",
								active && "border-primary text-primary ring-primary/30 ring-2",
							)}
						>
							{step.icon}
						</span>
						{i < steps.length - 1 && (
							<span className="bg-border absolute top-8 left-[13px] h-[calc(100%-1rem)] w-px" />
						)}
						<div className="mb-1.5 flex items-center justify-between gap-2">
							<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
								{step.title}
							</p>
							<div className="flex items-center gap-2">
								{step.model && (
									<span className="text-muted-foreground font-mono text-[11px]">
										{step.model}
									</span>
								)}
								{step.executorName && step.delegated && (
									<Badge className="gap-1 px-1.5 py-0 text-[10px] font-normal">
										<Cpu className="size-3" />
										{step.executorName}
									</Badge>
								)}
								{step.durationMs != null && (
									<span className="text-muted-foreground font-mono text-[11px] tabular-nums">
										{formatMs(step.durationMs)}
									</span>
								)}
							</div>
						</div>
						{step.body}
					</div>
				)
			})}
		</div>
	)
}
