import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CollapsiblePromptProps } from "@/types/conversations"

export function CollapsiblePrompt({
	text,
	collapsedLines = 8,
}: CollapsiblePromptProps) {
	const [open, setOpen] = useState(false)
	const overflows =
		text.split("\n").length > collapsedLines || text.length > 600

	return (
		<div className="space-y-1">
			<pre
				className={cn(
					"bg-muted/30 text-muted-foreground overflow-x-auto rounded-lg border px-4 py-3 font-mono text-xs whitespace-pre-wrap",
					overflows && !open && "max-h-32 overflow-y-hidden",
				)}
			>
				{text}
			</pre>
			{overflows && (
				<button
					type="button"
					onClick={() => setOpen(!open)}
					className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs"
				>
					<ChevronDown
						className={cn(
							"size-3.5 transition-transform",
							open && "rotate-180",
						)}
					/>
					{open ? "Show less" : "Show full prompt"}
				</button>
			)}
		</div>
	)
}
