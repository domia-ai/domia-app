import type { ReactNode } from "react"
import { Badge } from "@/components/ui/badge"

export function PageHeader({
	title,
	description,
	actions,
	badge,
}: {
	title: string
	description?: string
	actions?: ReactNode
	badge?: string
}) {
	return (
		<div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
			<div className="space-y-1">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-semibold tracking-tight text-balance">
						{title}
					</h1>
					{badge && (
						<Badge
							variant="outline"
							className="text-[10px] tracking-wide uppercase"
						>
							{badge}
						</Badge>
					)}
				</div>
				{description && (
					<p className="text-muted-foreground text-sm text-pretty">
						{description}
					</p>
				)}
			</div>
			{actions && <div className="flex items-center gap-2">{actions}</div>}
		</div>
	)
}
