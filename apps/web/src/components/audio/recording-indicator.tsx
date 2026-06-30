import { cn } from "@/lib/utils"
import type { RecordingIndicatorProps } from "@/types/chat"

const fmt = (s: number) =>
	`${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

export function RecordingIndicator({
	seconds,
	level,
	className,
}: RecordingIndicatorProps) {
	return (
		<span
			className={cn(
				"text-destructive flex items-center gap-2 font-mono text-xs tabular-nums",
				className,
			)}
		>
			<span className="relative flex size-2.5">
				<span className="bg-destructive absolute inline-flex size-full animate-ping rounded-full opacity-75" />
				<span className="bg-destructive relative inline-flex size-2.5 rounded-full" />
			</span>
			{fmt(seconds)}
			<span className="bg-muted relative h-1 w-16 overflow-hidden rounded-full">
				<span
					className="bg-destructive absolute inset-y-0 left-0 rounded-full transition-[width] duration-75"
					style={{ width: `${Math.round(level * 100)}%` }}
				/>
			</span>
		</span>
	)
}
