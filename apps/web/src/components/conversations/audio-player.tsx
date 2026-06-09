import { useEffect, useRef } from "react"
import { AudioLines, Download, Mic } from "lucide-react"
import { Waveform } from "@/components/audio/waveform"
import { useReplayController } from "./replay-provider"
import { formatBytes } from "@/utils/format"
import type { WaveformHandle } from "@/types"
import type { AudioPlayerProps } from "@/types/conversations"

export function AudioPlayer({ src, kind, bytes, engine }: AudioPlayerProps) {
	const controller = useReplayController()
	const wfRef = useRef<WaveformHandle | null>(null)

	useEffect(
		() => () => controller.registerTrack(kind, null),
		[controller, kind],
	)

	if (!src) {
		return (
			<div className="text-muted-foreground rounded-lg border border-dashed px-4 py-3 text-sm">
				No {kind === "input" ? "input" : "TTS"} audio archived for this trace.
			</div>
		)
	}

	const Icon = kind === "input" ? Mic : AudioLines

	return (
		<div className="bg-card rounded-lg border p-3">
			<div className="mb-2 flex items-center justify-between text-xs">
				<span className="flex items-center gap-1.5 font-medium">
					<Icon className="size-3.5" />
					{kind === "input"
						? "User audio (input)"
						: `TTS output${engine ? ` · ${engine}` : ""}`}
				</span>
				<span className="text-muted-foreground flex items-center gap-2">
					{formatBytes(bytes ?? null)}
					<a
						href={src}
						download
						className="hover:text-foreground transition-colors"
						aria-label="Download audio"
						onClick={(e) => e.stopPropagation()}
					>
						<Download className="size-3.5" />
					</a>
				</span>
			</div>
			<Waveform
				ref={wfRef}
				src={src}
				accent={kind === "input" ? "input" : "primary"}
				showSpeed
				onReady={(d) => {
					controller.registerTrack(kind, wfRef.current)
					controller.emitReady(kind, d)
				}}
				onFinish={() => controller.emitFinish(kind)}
				onProgress={(t) => controller.emitProgress(kind, t)}
			/>
		</div>
	)
}
