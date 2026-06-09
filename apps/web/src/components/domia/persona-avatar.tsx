import { cn } from "@/lib/utils"
import { accentFor } from "@/utils/accent"
import { initials } from "@/utils/initials"

const SIZES = {
	sm: "size-7 text-[11px]",
	md: "size-9 text-xs",
	lg: "size-12 text-base",
}

export function PersonaAvatar({
	domiaKey,
	name,
	size = "md",
}: {
	domiaKey: string
	name: string
	size?: keyof typeof SIZES
}) {
	const accent = accentFor(domiaKey)

	return (
		<span
			className={cn(
				"flex shrink-0 items-center justify-center rounded-full font-semibold",
				SIZES[size],
			)}
			style={{
				backgroundColor: `color-mix(in oklch, ${accent} 20%, transparent)`,
				color: accent,
			}}
		>
			{initials(name)}
		</span>
	)
}
