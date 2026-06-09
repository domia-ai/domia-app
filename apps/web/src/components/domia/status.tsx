import { cn } from "@/lib/utils"

export function StatusDot({ online }: { online: boolean }) {
	return (
		<span className="relative flex size-2">
			{online && (
				<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-60" />
			)}
			<span
				className={cn(
					"relative inline-flex size-2 rounded-full",
					online ? "bg-emerald-500" : "bg-muted-foreground/40",
				)}
			/>
		</span>
	)
}

export function StatusPill({ online }: { online: boolean }) {
	return (
		<span className="inline-flex items-center gap-2 text-sm">
			<StatusDot online={online} />
			{online ? "Online" : "Offline"}
		</span>
	)
}
