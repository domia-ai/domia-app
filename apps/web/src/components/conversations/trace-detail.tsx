import {
	AudioLines,
	Brain,
	Compass,
	Ear,
	MessageSquare,
	Mic,
	Radio,
	Type,
	Wrench,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatMaybeJson, formatMs } from "@/utils/format"
import { buildLatency } from "@/utils/latency"
import { humanizeDomiaKey } from "@/utils/journey"
import { AudioPlayer } from "./audio-player"
import { CollapsiblePrompt } from "./collapsible-prompt"
import { PipelineClient } from "./pipeline-client"
import type {
	DomiaSnapshot,
	InteractionDetail,
	PipelineStep,
} from "@/types/conversations"

export function TraceDetail({ detail }: { detail: InteractionDetail }) {
	const { trace, inputAudio, ttsAudio } = detail
	const isVoice = trace.inputType === "VOICE"
	const skillResponse = formatMaybeJson(trace.skillResponse)
	const skillTotalMs = Array.isArray(trace.skillResponse)
		? (trace.skillResponse as { ms?: number }[]).reduce(
				(sum, t) => sum + (typeof t?.ms === "number" ? t.ms : 0),
				0,
			) || undefined
		: undefined
	const lat = buildLatency(trace)
	const originKey = trace.sourceDomiaKey
	const snapshot = trace.domiaSnapshot as DomiaSnapshot | null
	const execInfo = (key: string | null) =>
		key
			? {
					executorName: humanizeDomiaKey(key),
					delegated: key !== originKey,
				}
			: {}
	const sttModel = trace.sttModelUsed ?? snapshot?.stt?.modelName ?? undefined
	const llmModel = trace.llmModelUsed ?? snapshot?.llm?.modelName ?? undefined
	const ttsModel =
		[trace.ttsEngineUsed, trace.ttsVoiceUsed].filter(Boolean).join(" · ") ||
		(snapshot?.tts
			? [snapshot.tts.engine, snapshot.tts.voiceName]
					.filter(Boolean)
					.join(" · ")
			: undefined) ||
		undefined
	const steps: PipelineStep[] = []

	if (isVoice && trace.wakewordUsed) {
		steps.push({
			key: "wakeword",
			icon: <Radio className="size-3.5" />,
			title: "Wake word",
			model: trace.wakeWordModelUsed ?? snapshot?.wakeWord?.model ?? undefined,
			body: (
				<div className="bg-muted/30 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm">
					<span className="relative flex size-2.5">
						<span className="bg-primary/60 absolute inline-flex size-full animate-ping rounded-full" />
						<span className="bg-primary relative inline-flex size-2.5 rounded-full" />
					</span>
					<span className="font-medium">
						&ldquo;{trace.wakewordUsed}&rdquo;
					</span>
					<span className="text-muted-foreground">
						detected · session opened
					</span>
				</div>
			),
		})
	}

	steps.push({
		key: "input",
		icon: isVoice ? (
			<Mic className="size-3.5" />
		) : (
			<Type className="size-3.5" />
		),
		title: isVoice ? "Captured audio" : "Text input",
		body: isVoice ? (
			<AudioPlayer
				kind="input"
				src={`/api/audio/${trace.id}?kind=input`}
				bytes={inputAudio?.bytes}
			/>
		) : (
			<p className="bg-muted/30 rounded-lg border px-4 py-3 text-sm">
				{trace.inputRaw ?? "—"}
			</p>
		),
	})

	if (isVoice) {
		steps.push({
			key: "stt",
			icon: <Ear className="size-3.5" />,
			title: "Speech-to-text",
			durationMs: trace.sttMs ?? undefined,
			model: sttModel,
			...execInfo(trace.sttExecutorKey),
			body: (
				<p className="bg-muted/30 rounded-lg border px-4 py-3 text-sm">
					{trace.sttResult ?? "—"}
				</p>
			),
		})
	}

	if (trace.intentDecision) {
		steps.push({
			key: "intent",
			icon: <Compass className="size-3.5" />,
			title: "Intent gate",
			durationMs: trace.intentMs ?? undefined,
			body: (
				<p className="bg-muted/30 rounded-lg border px-4 py-3 text-sm">
					Routed to <span className="font-medium">{trace.intentDecision}</span>
				</p>
			),
		})
	}

	if (trace.skillProviderUsed) {
		steps.push({
			key: "skill",
			icon: <Wrench className="size-3.5" />,
			title: "Tool call",
			durationMs: skillTotalMs,
			body: (
				<div className="bg-muted/30 space-y-2 rounded-lg border px-4 py-3 text-sm">
					<Badge variant="secondary" className="font-mono text-[11px]">
						{trace.skillProviderUsed}
					</Badge>
					{trace.skillPrompt && (
						<pre className="bg-background/60 text-muted-foreground overflow-x-auto rounded-md px-3 py-2 font-mono text-xs">
							{trace.skillPrompt}
						</pre>
					)}
					{skillResponse && (
						<pre className="bg-background/60 overflow-x-auto rounded-md px-3 py-2 font-mono text-xs">
							{skillResponse}
						</pre>
					)}
				</div>
			),
		})
	}

	steps.push({
		key: "llmPrompt",
		icon: <Brain className="size-3.5" />,
		title: "LLM prompt",
		body: <CollapsiblePrompt text={trace.llmPrompt ?? "—"} />,
	})

	steps.push({
		key: "llmResponse",
		icon: <MessageSquare className="size-3.5" />,
		title: "LLM response",
		durationMs: trace.llmMs ?? undefined,
		model: llmModel,
		...execInfo(trace.llmExecutorKey),
		body: (
			<p className="bg-muted/30 rounded-lg border px-4 py-3 text-sm">
				{trace.llmResponse ?? "—"}
			</p>
		),
	})

	if (trace.responseType === "voice" || ttsAudio) {
		steps.push({
			key: "tts",
			icon: <AudioLines className="size-3.5" />,
			title: "Text-to-speech",
			durationMs: trace.ttsMs ?? undefined,
			model: ttsModel,
			...execInfo(trace.ttsExecutorKey),
			body: (
				<AudioPlayer
					kind="tts"
					src={`/api/audio/${trace.id}?kind=tts`}
					bytes={ttsAudio?.bytes}
					engine={trace.ttsEngineUsed}
				/>
			),
		})
	}

	return (
		<div className="space-y-4">
			{lat && (
				<div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
					<span className="text-foreground font-mono font-medium tabular-nums">
						Total {formatMs(lat.totalMs)}
					</span>
					{lat.ttfaMs != null && (
						<span className="font-mono tabular-nums">
							TTFA {formatMs(lat.ttfaMs)}
						</span>
					)}
					{lat.delegated && (
						<span className="bg-muted rounded px-1.5 py-0.5">
							delegated · round-trip
						</span>
					)}
				</div>
			)}
			<PipelineClient steps={steps} />
		</div>
	)
}
