import { useEffect, useRef, useState } from "react"
import { Pause, Play } from "lucide-react"
import type { InlineAudioProps } from "@/types/conversations"

export function InlineAudio({ interactionId, kind }: InlineAudioProps) {
	const ref = useRef<HTMLAudioElement | null>(null)
	const [mounted, setMounted] = useState(false)
	const [playing, setPlaying] = useState(false)

	useEffect(() => setMounted(true), [])

	const toggle = (e: React.MouseEvent) => {
		e.stopPropagation()
		const el = ref.current
		if (!el) return
		if (playing) el.pause()
		else void el.play()
	}

	return (
		<>
			<button
				type="button"
				onClick={toggle}
				aria-label={playing ? "Pause" : "Play"}
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
					src={`/api/audio/${interactionId}?kind=${kind}`}
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
