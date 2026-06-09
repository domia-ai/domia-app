import { cn } from "@/lib/utils"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { CAPABILITY_META, CAPABILITY_ORDER } from "@/constants/capabilities"
import type { CapabilityKey, RuntimeCapabilities } from "@/types"

export function CapabilityChips({
	capabilities,
	delegated = [],
	size = "md",
}: {
	capabilities: RuntimeCapabilities | null
	delegated?: CapabilityKey[]
	size?: "sm" | "md"
}) {
	return (
		<div className="flex flex-wrap gap-1.5">
			{CAPABILITY_ORDER.map((key) => {
				const meta = CAPABILITY_META[key]
				const enabled = Boolean(capabilities?.[key])
				const isDelegated = delegated.includes(key)
				const Icon = meta.icon
				return (
					<Tooltip key={key}>
						<TooltipTrigger
							render={
								<span
									className={cn(
										"inline-flex items-center gap-1 rounded-md border font-medium transition-colors",
										size === "sm"
											? "px-1.5 py-0.5 text-[10px]"
											: "px-2 py-1 text-xs",
										enabled
											? "border-primary/20 bg-primary/10 text-foreground"
											: isDelegated
												? "border-warning/30 bg-warning/10 text-foreground"
												: "border-border bg-muted/40 text-muted-foreground/60",
									)}
								/>
							}
						>
							<Icon className={size === "sm" ? "size-3" : "size-3.5"} />
							{meta.short}
						</TooltipTrigger>
						<TooltipContent>
							{meta.label}
							{isDelegated
								? " · delegated"
								: enabled
									? " · local"
									: " · disabled"}
						</TooltipContent>
					</Tooltip>
				)
			})}
		</div>
	)
}
