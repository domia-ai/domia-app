import { Link } from "@tanstack/react-router"
import { ChevronLeft, ChevronRight, Layers } from "lucide-react"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"
import type { SessionNavProps } from "@/types/conversations"

export function SessionNav({ adjacent, sessionId }: SessionNavProps) {
	const linkClass =
		"text-muted-foreground hover:bg-muted hover:text-foreground inline-flex size-7 items-center justify-center rounded-md border transition-colors"
	const disabledClass = "pointer-events-none opacity-40"

	return (
		<div className="flex items-center gap-2 text-sm">
			{adjacent.prevId ? (
				<Link
					to="/conversations/$id"
					params={{ id: adjacent.prevId }}
					className={linkClass}
					aria-label={m.conv_prev_turn()}
				>
					<ChevronLeft className="size-4" />
				</Link>
			) : (
				<span className={cn(linkClass, disabledClass)} aria-hidden="true">
					<ChevronLeft className="size-4" />
				</span>
			)}
			<span className="text-muted-foreground">
				{m.conv_turn_of({ index: adjacent.index + 1, total: adjacent.total })}
			</span>
			{adjacent.nextId ? (
				<Link
					to="/conversations/$id"
					params={{ id: adjacent.nextId }}
					className={linkClass}
					aria-label={m.conv_next_turn()}
				>
					<ChevronRight className="size-4" />
				</Link>
			) : (
				<span className={cn(linkClass, disabledClass)} aria-hidden="true">
					<ChevronRight className="size-4" />
				</span>
			)}
			<Link
				to="/conversations/session/$id"
				params={{ id: sessionId }}
				className="text-muted-foreground hover:text-foreground ml-1 inline-flex items-center gap-1.5 text-xs transition-colors"
			>
				<Layers className="size-3.5" />
				{m.conv_full_session()}
			</Link>
		</div>
	)
}
