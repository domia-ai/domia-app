import { ArrowDown, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

const LABELS: Record<string, string> = {
	joy: "Joy",
	trust: "Trust",
	fear: "Fear",
	surprise: "Surprise",
	sadness: "Sadness",
	disgust: "Disgust",
	anger: "Anger",
	anticipation: "Anticip.",
}

export function DeltaChips({ delta }: { delta: unknown }) {
	const parsed =
		delta && typeof delta === "object" ? (delta as Record<string, unknown>) : {}

	const entries = Object.entries(parsed).filter(
		(e): e is [string, number] => typeof e[1] === "number" && e[1] !== 0,
	)

	if (!entries.length)
		return <span className="text-muted-foreground text-xs">no change</span>

	return (
		<div className="flex flex-wrap gap-1.5">
			{entries.map(([key, value]) => {
				const up = value > 0
				return (
					<span
						key={key}
						className={cn(
							"inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
							up
								? "bg-emerald-500/10 text-emerald-600"
								: "bg-rose-500/10 text-rose-600",
						)}
					>
						{up ? (
							<ArrowUp className="size-3" />
						) : (
							<ArrowDown className="size-3" />
						)}
						{LABELS[key] ?? key} {value > 0 ? "+" : ""}
						{value.toFixed(2)}
					</span>
				)
			})}
		</div>
	)
}
