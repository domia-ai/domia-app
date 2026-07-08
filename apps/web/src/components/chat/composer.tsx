import { useRef, useState } from "react"
import {
	Loader2,
	Mic,
	Paperclip,
	Send,
	Square,
	Type,
	Volume2,
	X,
} from "lucide-react"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
	InputGroup,
	InputGroupAddon,
	InputGroupButton,
	InputGroupTextarea,
} from "@/components/ui/input-group"
import { RecordingIndicator } from "@/components/audio/recording-indicator"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { isDemoMode } from "@/lib/demo"
import type { ComposerProps } from "@/types/chat"

const toBase64 = (file: File): Promise<string> =>
	new Promise((resolve, reject) => {
		const reader = new FileReader()
		reader.onload = () => {
			const result = reader.result as string
			resolve(result.split(",")[1] ?? "")
		}
		reader.onerror = () => reject(new Error("Could not read file"))
		reader.readAsDataURL(file)
	})

export function Composer({
	disabled: disabledProp,
	onSendText,
	onSendVoice,
}: ComposerProps) {
	const demoMode = isDemoMode()
	const disabled = disabledProp || demoMode
	const [draft, setDraft] = useState("")
	const [speak, setSpeak] = useState(false)
	const [clip, setClip] = useState<string | null>(null)
	const fileRef = useRef<HTMLInputElement | null>(null)

	const recorder = useAudioRecorder(setClip)

	const submitText = () => {
		const text = draft.trim()
		if (!text || disabled) return
		onSendText(text, speak)
		setDraft("")
	}

	const submitVoice = () => {
		if (!clip || disabled) return
		onSendVoice(clip, "recording.wav", speak)
		setClip(null)
	}

	const pickFile = async (file: File | undefined) => {
		if (!file || disabled) return
		const audioBase64 = await toBase64(file)
		if (audioBase64) setClip(audioBase64)
		if (fileRef.current) fileRef.current.value = ""
	}

	const reviewing = clip !== null && !recorder.recording

	return (
		<div className="flex flex-col gap-2">
			<div className="flex items-center gap-2">
				<span className="text-muted-foreground text-xs font-medium">
					{m.chat_reply_as()}
				</span>
				<ToggleGroup
					variant="outline"
					size="sm"
					value={[speak ? "voice" : "text"]}
					onValueChange={(group) => {
						const next = group[0]
						if (next === "text" || next === "voice") setSpeak(next === "voice")
					}}
				>
					<ToggleGroupItem value="text">
						<Type className="size-3.5" /> {m.chat_reply_text()}
					</ToggleGroupItem>
					<ToggleGroupItem value="voice">
						<Volume2 className="size-3.5" /> {m.chat_reply_voice()}
					</ToggleGroupItem>
				</ToggleGroup>

				<input
					ref={fileRef}
					type="file"
					accept="audio/wav,audio/x-wav,.wav"
					className="hidden"
					onChange={(e) => pickFile(e.target.files?.[0])}
				/>
				<Button
					type="button"
					variant="ghost"
					size="sm"
					className="ml-auto"
					disabled={disabled || recorder.recording || recorder.converting}
					onClick={() => fileRef.current?.click()}
				>
					<Paperclip className="size-3.5" />
					{m.chat_upload_wav()}
				</Button>
			</div>

			{reviewing ? (
				<div className="border-border bg-muted/20 flex flex-col gap-2 rounded-lg border p-3">
					<div className="flex items-center gap-2 text-sm">
						<Volume2 className="text-primary size-4" />
						<span className="font-medium">{m.chat_review_voice()}</span>
						<div className="ml-auto flex items-center gap-1">
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={disabled}
								onClick={() => {
									setClip(null)
									void recorder.start()
								}}
							>
								<Mic className="size-3.5" /> {m.chat_rerecord()}
							</Button>
							<Button
								type="button"
								variant="ghost"
								size="sm"
								disabled={disabled}
								onClick={() => setClip(null)}
							>
								<X className="size-3.5" /> {m.chat_discard()}
							</Button>
						</div>
					</div>
					<audio
						controls
						src={`data:audio/wav;base64,${clip}`}
						className="h-9 w-full"
					/>
					<div className="flex items-center justify-between">
						<span className="text-muted-foreground text-xs">
							{speak ? m.chat_reply_as_voice() : m.chat_reply_as_text()}
						</span>
						<Button
							type="button"
							size="sm"
							disabled={disabled}
							onClick={submitVoice}
						>
							<Send className="size-4" /> {m.chat_send()}
						</Button>
					</div>
				</div>
			) : (
				<InputGroup>
					<InputGroupTextarea
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault()
								submitText()
							}
						}}
						placeholder={
							demoMode ? m.chat_placeholder_demo() : m.chat_placeholder()
						}
						disabled={disabled || recorder.recording}
						rows={1}
					/>
					<InputGroupAddon align="block-end" className="pt-1">
						<InputGroupButton
							type="button"
							size="icon-sm"
							variant={recorder.recording ? "default" : "outline"}
							disabled={disabled || recorder.converting}
							className={recorder.recording ? "animate-pulse" : ""}
							onClick={recorder.recording ? recorder.stop : recorder.start}
						>
							{recorder.converting ? (
								<Loader2 className="size-4 animate-spin" />
							) : recorder.recording ? (
								<Square className="size-4" />
							) : (
								<Mic className="size-4" />
							)}
						</InputGroupButton>
						{recorder.recording ? (
							<RecordingIndicator
								seconds={recorder.seconds}
								level={recorder.level}
							/>
						) : null}
						<InputGroupButton
							type="button"
							size="icon-sm"
							variant="default"
							className="ml-auto"
							disabled={disabled || !draft.trim()}
							onClick={submitText}
						>
							<Send className="size-4" />
						</InputGroupButton>
					</InputGroupAddon>
				</InputGroup>
			)}
		</div>
	)
}
