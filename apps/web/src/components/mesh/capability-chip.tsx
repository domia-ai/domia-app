import { cn } from "@/lib/utils"
import type { MeshCapability } from "@/types/mesh"

export function CapabilityChip({
	capability,
	local,
}: {
	capability: MeshCapability
	local: boolean
}) {
	return (
		<span
			className={cn(
				"rounded px-1.5 py-0.5 font-mono text-[10px] font-medium",
				local
					? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
					: "text-muted-foreground/50 bg-muted-foreground/10 line-through",
			)}
			title={local ? `${capability} runs locally` : `${capability} delegated`}
		>
			{capability}
		</span>
	)
}
