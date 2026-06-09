import { Link } from "@tanstack/react-router"
import { Mic, Type } from "lucide-react"
import { relativeTime } from "@/utils/format"
import type { SessionDetail } from "@/types/conversations"

export function SessionThread({ detail }: { detail: SessionDetail }) {
	const { turns } = detail

	if (!turns.length) {
		return (
			<p className="text-muted-foreground text-sm">No turns in this session.</p>
		)
	}

	return (
		<div className="space-y-6">
			{turns.map((turn, i) => {
				const Icon = turn.inputType === "VOICE" ? Mic : Type
				return (
					<div key={turn.id} className="relative pl-9">
						<span className="bg-card absolute top-1 left-0 flex size-6 items-center justify-center rounded-full border text-[11px] font-semibold">
							{i + 1}
						</span>
						{i < turns.length - 1 && (
							<span className="bg-border absolute top-7 left-[11px] h-[calc(100%+0.5rem)] w-px" />
						)}
						<div className="space-y-2">
							<div className="text-muted-foreground flex items-center gap-2 text-xs">
								<Icon className="size-3.5" />
								{relativeTime(turn.createdAt)}
							</div>
							<p className="bg-muted/30 rounded-lg border px-4 py-2.5 text-sm">
								{turn.sttResult ?? turn.inputRaw ?? "—"}
							</p>
							{turn.llmResponse && (
								<p className="border-primary/20 bg-primary/5 rounded-lg border px-4 py-2.5 text-sm">
									{turn.llmResponse}
								</p>
							)}
							<Link
								to="/conversations/$id"
								params={{ id: turn.id }}
								className="text-muted-foreground hover:text-foreground text-xs transition-colors"
							>
								View full trace →
							</Link>
						</div>
					</div>
				)
			})}
		</div>
	)
}
