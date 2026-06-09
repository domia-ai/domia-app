import { ChevronDown } from "lucide-react"
import { Card } from "@/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { CopyButton } from "./copy-button"
import type { RawTraceProps } from "@/types/conversations"

export function RawTrace({ trace }: RawTraceProps) {
	const json = JSON.stringify(trace, null, 2)
	return (
		<Card className="min-w-0">
			<Collapsible>
				<div className="flex items-center justify-between px-6 py-4">
					<CollapsibleTrigger className="group flex items-center gap-2 text-base font-semibold outline-none">
						<ChevronDown className="size-4 transition-transform group-data-[panel-open]:rotate-180" />
						Raw trace JSON
					</CollapsibleTrigger>
					<CopyButton text={json} label="Copy" />
				</div>
				<CollapsibleContent>
					<div className="px-6 pb-6">
						<div className="max-h-[420px] max-w-full overflow-auto rounded-lg border">
							<pre className="text-muted-foreground w-max min-w-full p-4 font-mono text-xs leading-relaxed whitespace-pre">
								{json}
							</pre>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</Card>
	)
}
