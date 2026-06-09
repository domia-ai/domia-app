import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

const ACCENTS = {
	primary: "text-primary bg-primary/10",
	success: "text-success bg-success/10",
	warning: "text-warning bg-warning/10",
	muted: "text-muted-foreground bg-muted",
}

export function StatCard({
	label,
	value,
	hint,
	icon: Icon,
	accent = "primary",
}: {
	label: string
	value: ReactNode
	hint?: string
	icon: LucideIcon
	accent?: keyof typeof ACCENTS
}) {
	return (
		<Card className="flex flex-row items-center gap-4 p-5">
			<span
				className={cn(
					"flex size-11 shrink-0 items-center justify-center rounded-lg",
					ACCENTS[accent],
				)}
			>
				<Icon className="size-5" />
			</span>
			<div className="min-w-0">
				<p className="text-muted-foreground text-sm">{label}</p>
				<p className="text-2xl leading-tight font-semibold tabular-nums">
					{value}
				</p>
				{hint && (
					<p className="text-muted-foreground truncate text-xs">{hint}</p>
				)}
			</div>
		</Card>
	)
}
