import { useRef, useState } from "react"
import { Loader2, Mic, Paperclip, Send, Square, Volume2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import { blobToWav16kBase64 } from "@/lib/wav-encode"
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
	const [recording, setRecording] = useState(false)
	const [converting, setConverting] = useState(false)
	const fileRef = useRef<HTMLInputElement | null>(null)
	const recorderRef = useRef<MediaRecorder | null>(null)
	const chunksRef = useRef<Blob[]>([])
	const speakRef = useRef(speak)
	speakRef.current = speak

	const submit = () => {
		const text = draft.trim()
		if (!text || disabled) return
		onSendText(text, speak)
		setDraft("")
	}

	const pickFile = async (file: File | undefined) => {
		if (!file || disabled) return
		const audioBase64 = await toBase64(file)
		if (audioBase64) onSendVoice(audioBase64, file.name, speak)
		if (fileRef.current) fileRef.current.value = ""
	}

	const startRecording = async () => {
		if (disabled || recording) return
		try {
			const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
			const recorder = new MediaRecorder(stream)
			chunksRef.current = []
			recorder.ondataavailable = (e) => {
				if (e.data.size > 0) chunksRef.current.push(e.data)
			}
			recorder.onstop = async () => {
				for (const track of stream.getTracks()) track.stop()
				setRecording(false)
				const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
				if (blob.size === 0) return
				setConverting(true)
				try {
					const audioBase64 = await blobToWav16kBase64(blob)
					onSendVoice(audioBase64, "recording.wav", speakRef.current)
				} catch {
					toast.error("Could not process the recording")
				} finally {
					setConverting(false)
				}
			}
			recorderRef.current = recorder
			recorder.start()
			setRecording(true)
		} catch {
			toast.error("Microphone access was denied")
		}
	}

	const stopRecording = () => recorderRef.current?.stop()

	return (
		<div className="space-y-2">
			<div className="relative">
				<Textarea
					value={draft}
					onChange={(e) => setDraft(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && !e.shiftKey) {
							e.preventDefault()
							submit()
						}
					}}
					placeholder={
						demoMode
							? "Chat needs a live mesh — disabled in this read-only demo"
							: "Type a message… (Enter to send, Shift+Enter for newline)"
					}
					disabled={disabled}
					className="max-h-40 min-h-[3rem] resize-none pr-12"
				/>
				<Button
					type="button"
					size="icon"
					onClick={submit}
					disabled={disabled || !draft.trim()}
					className="absolute right-2 bottom-2 size-8"
				>
					<Send className="size-4" />
				</Button>
			</div>

			<div className="flex items-center gap-2">
				<Toggle
					pressed={speak}
					onPressedChange={setSpeak}
					variant="outline"
					size="sm"
					className={cn(speak && "border-primary text-primary")}
				>
					<Volume2 className="size-3.5" />
					Speak replies
				</Toggle>

				<Button
					type="button"
					variant={recording ? "destructive" : "outline"}
					size="sm"
					disabled={disabled || converting}
					onClick={recording ? stopRecording : startRecording}
				>
					{converting ? (
						<Loader2 className="size-3.5 animate-spin" />
					) : recording ? (
						<Square className="size-3.5" />
					) : (
						<Mic className="size-3.5" />
					)}
					{converting ? "Processing…" : recording ? "Stop" : "Record"}
				</Button>

				<input
					ref={fileRef}
					type="file"
					accept="audio/wav,audio/x-wav,.wav"
					className="hidden"
					onChange={(e) => pickFile(e.target.files?.[0])}
				/>
				<Button
					type="button"
					variant="outline"
					size="sm"
					disabled={disabled || recording || converting}
					onClick={() => fileRef.current?.click()}
				>
					<Paperclip className="size-3.5" />
					Upload WAV
				</Button>

				<span className="text-muted-foreground ml-auto text-xs">
					{recording
						? "recording…"
						: `${speak ? "spoken reply" : "text reply"} · captured at 16 kHz mono`}
				</span>
			</div>
		</div>
	)
}
