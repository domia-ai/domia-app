import { useState, useTransition } from "react"
import { Play, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { formatMs } from "@/utils/format"
import { humanizeDomiaKey } from "@/utils/journey"
import { runInteraction } from "@/server/run"
import { isDemoMode } from "@/lib/demo"
import type {
	RunInteractionResult,
	RunAgainPanelProps,
	RunMode,
} from "@/types/conversations"

export function RunAgainPanel({
	sourceInteractionId,
	originKey,
	targets,
	originalReply,
	originalTrace,
}: RunAgainPanelProps) {
	const demoMode = isDemoMode()
	const [targetKey, setTargetKey] = useState(originKey)
	const [result, setResult] = useState<RunInteractionResult | null>(null)
	const [pending, start] = useTransition()

	const sourceIsVoice = originalTrace.inputType === "VOICE"
	const mode: RunMode = sourceIsVoice
		? targetKey === originKey
			? "voice"
			: "transcript-as-voice"
		: "text"

	const run = () =>
		start(async () => {
			setResult(null)
			const res = await runInteraction({
				data: {
					sourceInteractionId,
					targetDomiaKey: targetKey,
					mode,
				},
			})
			if (res.ok && res.data) {
				setResult(res.data)
				toast.success("Re-ran the interaction")
			} else if (!res.ok) {
				toast.error(res.error)
			}
		})

	const origMs = originalTrace.totalMs
	const newMs = result?.timings?.totalMs ?? null
	const delta = origMs != null && newMs != null ? newMs - origMs : null

	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				<Select
					value={targetKey}
					onValueChange={(v) => v && setTargetKey(v)}
					items={targets.map((t) => ({
						value: t.domiaKey,
						label: t.isOrigin
							? `${humanizeDomiaKey(t.domiaKey)} (origin)`
							: humanizeDomiaKey(t.domiaKey),
					}))}
				>
					<SelectTrigger className="h-9 flex-1">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{targets.map((t) => (
							<SelectItem
								key={t.domiaKey}
								value={t.domiaKey}
								disabled={!t.isOrigin && !t.online}
							>
								{t.isOrigin
									? `${humanizeDomiaKey(t.domiaKey)} (origin)`
									: humanizeDomiaKey(t.domiaKey)}
								{!t.isOrigin && !t.online ? " · offline" : ""}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button onClick={run} disabled={pending || demoMode} className="h-9">
					{pending ? (
						<RefreshCw className="size-4 animate-spin" />
					) : (
						<Play className="size-4" />
					)}
					Run
				</Button>
			</div>

			{demoMode && (
				<p className="text-muted-foreground text-xs">
					Re-running needs a live mesh — disabled in this read-only demo.
				</p>
			)}

			{mode === "transcript-as-voice" && (
				<p className="text-muted-foreground text-xs">
					Cross-node voice re-run uses the transcript re-spoken (approximation).
				</p>
			)}

			{result && (
				<div className="space-y-3 border-t pt-3">
					<div className="grid grid-cols-2 gap-3 text-sm">
						<div className="space-y-1">
							<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
								Original
							</p>
							<p className="bg-muted/30 rounded-lg border px-3 py-2">
								{originalReply ?? "—"}
							</p>
						</div>
						<div className="space-y-1">
							<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
								New
							</p>
							<p className="border-primary/20 bg-primary/5 rounded-lg border px-3 py-2">
								{result.reply}
							</p>
						</div>
					</div>

					<div className="flex items-center gap-3 text-sm">
						<span className="text-muted-foreground">Latency</span>
						<span className="font-mono tabular-nums">
							{formatMs(origMs)} → {formatMs(newMs)}
						</span>
						{delta != null && (
							<span
								className={delta <= 0 ? "text-success" : "text-destructive"}
							>
								{delta <= 0 ? "" : "+"}
								{formatMs(delta)}
							</span>
						)}
					</div>

					{result.newInteractionId && (
						<p className="text-muted-foreground text-xs">
							New interaction {result.newInteractionId.slice(0, 8)} — appears in
							Conversations after the next sync.
						</p>
					)}
				</div>
			)}
		</div>
	)
}
