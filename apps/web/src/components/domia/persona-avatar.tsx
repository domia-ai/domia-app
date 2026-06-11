import { useState } from "react"
import { cn } from "@/lib/utils"
import { accentFor } from "@/utils/accent"
import { initials } from "@/utils/initials"
import {
	customAvatarSrc,
	isCustomAvatar,
	isPresetAvatar,
	presetSrc,
} from "@/constants/avatars"

const SIZES = {
	sm: "size-7 text-[11px]",
	md: "size-9 text-xs",
	lg: "size-12 text-base",
}

export function PersonaAvatar({
	domiaKey,
	name,
	avatarId,
	size = "md",
}: {
	domiaKey: string
	name: string
	avatarId?: string | null
	size?: keyof typeof SIZES
}) {
	const accent = accentFor(domiaKey)
	const [failedSrc, setFailedSrc] = useState<string | null>(null)

	const src = isPresetAvatar(avatarId)
		? presetSrc(avatarId as string)
		: isCustomAvatar(avatarId)
			? customAvatarSrc(domiaKey)
			: null

	if (src && src !== failedSrc)
		return (
			<img
				src={src}
				alt={name}
				onError={() => setFailedSrc(src)}
				className={cn(
					"shrink-0 rounded-full object-cover",
					SIZES[size].split(" ")[0],
				)}
			/>
		)

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
