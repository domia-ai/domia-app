import { m } from "@/paraglide/messages"
import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import type { InlineAudioProps } from "@/types/conversations"

export function InlineAudio({ interactionId, kind }: InlineAudioProps) {
	const ref = useRef<HTMLAudioElement | null>(null)
	const objectUrl = useRef<string | null>(null)
	const [mounted, setMounted] = useState(false)
	const [playing, setPlaying] = useState(false)

	useEffect(() => setMounted(true), [])
	useEffect(
		() => () => {
			if (objectUrl.current) URL.revokeObjectURL(objectUrl.current)
		},
		[],
	)

	const toggle = async (e: React.MouseEvent) => {
		e.stopPropagation()
		const el = ref.current
		if (!el) return
		if (playing) {
			el.pause()
			return
		}
		try {
			if (!objectUrl.current) {
				const res = await fetch(`/api/audio/${interactionId}?kind=${kind}`)
				if (!res.ok) return
				objectUrl.current = URL.createObjectURL(await res.blob())
				el.src = objectUrl.current
			}
			await el.play()
		} catch {
			setPlaying(false)
		}
	}

	return (
		<>
			<button
				type="button"
				onClick={toggle}
				aria-label={playing ? m.conv_pause() : m.conv_play()}
				className="bg-primary/10 text-primary hover:bg-primary/20 flex size-6 shrink-0 items-center justify-center rounded-full transition-colors"
			>
				{playing ? (
					<Pause className="size-3" />
				) : (
					<Play className="size-3 translate-x-px" />
				)}
			</button>
			{mounted && (
				<audio
					ref={ref}
					preload="none"
					className="hidden"
					onPlay={() => setPlaying(true)}
					onPause={() => setPlaying(false)}
					onEnded={() => setPlaying(false)}
				/>
			)}
		</>
	)
}
