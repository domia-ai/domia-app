import { m } from "@/paraglide/messages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatMs } from "@/utils/format"
import type { WaterfallData } from "@/types/analytics"

const STAGE_BG: Record<string, string> = {
	stt: "bg-chart-1",
	llm: "bg-chart-2",
	tts: "bg-chart-3",
}

export function WaterfallPanel({
	data,
	title = m.analytics_waterfall_title(),
}: {
	data: WaterfallData
	title?: string
}) {
	const denom = Math.max(data.sumMs, 1)
	const ttfaPct = Math.min(100, (data.ttfaMs / denom) * 100)
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{title}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="relative h-10">
					<div className="bg-muted absolute inset-0 flex overflow-hidden rounded-md">
						{data.stages.map((s) => (
							<div
								key={s.key}
								className={cn("h-full", STAGE_BG[s.key])}
								style={{ width: `${(s.ms / denom) * 100}%` }}
								title={`${s.label} · ${formatMs(s.ms)}`}
							/>
						))}
					</div>
					<div
						className="bg-foreground absolute top-0 bottom-0 w-0.5"
						style={{ left: `${ttfaPct}%` }}
						title={`${m.analytics_first_audio()} · ${formatMs(data.ttfaMs)}`}
					/>
				</div>
				<div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
					{data.stages.map((s) => (
						<span key={s.key} className="flex items-center gap-2">
							<span className={cn("size-2.5 rounded-full", STAGE_BG[s.key])} />
							{s.label}
							<span className="text-muted-foreground font-mono tabular-nums">
								{formatMs(s.ms)}
							</span>
						</span>
					))}
				</div>
				<p className="text-muted-foreground text-xs">
					{m.analytics_waterfall_note_a()}{" "}
					<span className="text-foreground font-medium">
						{formatMs(data.ttfaMs)}
					</span>{" "}
					{m.analytics_waterfall_note_b()}{" "}
					<span className="text-foreground font-medium">
						{formatMs(data.pipelineGapMs)}
					</span>{" "}
					{m.analytics_waterfall_note_c({ sum: formatMs(data.sumMs) })}
				</p>
			</CardContent>
		</Card>
	)
}
