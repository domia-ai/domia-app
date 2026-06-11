import { cn } from "@/lib/utils"

export function ConfidenceBar({ value }: { value: number }) {
	const pct = Math.round(value * 100)
	const tone =
		value >= 0.7
			? "bg-emerald-500"
			: value >= 0.4
				? "bg-amber-500"
				: "bg-muted-foreground/50"
	return (
		<div className="flex items-center gap-2">
			<div className="bg-muted h-1.5 w-16 overflow-hidden rounded-full">
				<div
					className={cn("h-full rounded-full", tone)}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<span className="text-muted-foreground w-9 text-right font-mono text-xs tabular-nums">
				{pct}%
			</span>
		</div>
	)
}
