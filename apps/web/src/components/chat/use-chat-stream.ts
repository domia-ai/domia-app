import { useCallback, useEffect, useRef, useState } from "react"
import { m } from "@/paraglide/messages"
import type {
	ChatStreamInput,
	ChatStreamResult,
	ChatStreamState,
	ChatStreamStep,
	ChatStreamTool,
	UseChatStreamReturn,
} from "@/types/chat"

const idleState = (): ChatStreamState => ({
	status: "idle",
	runId: null,
	steps: [],
	tools: [],
	text: "",
	error: null,
})

const str = (v: unknown): string | null => (typeof v === "string" ? v : null)
const num = (v: unknown): number | null => (typeof v === "number" ? v : null)

const decodeFrame = (
	raw: string,
): { event: string; data: Record<string, unknown> } | null => {
	let event = ""
	const dataLines: string[] = []
	for (const line of raw.split("\n")) {
		if (line.startsWith("event:")) event = line.slice(6).trim()
		else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim())
	}
	if (!event) return null
	if (dataLines.length === 0) return { event, data: {} }
	try {
		const parsed: unknown = JSON.parse(dataLines.join("\n"))
		return parsed && typeof parsed === "object"
			? { event, data: parsed as Record<string, unknown> }
			: { event, data: {} }
	} catch {
		return { event, data: {} }
	}
}

const lastOpenIndex = <T extends { name: string; status: string | null }>(
	items: T[],
	name: string,
): number => {
	for (let i = items.length - 1; i >= 0; i--) {
		if (items[i].name === name && items[i].status === null) return i
	}
	return -1
}

const closeStep = (
	steps: ChatStreamStep[],
	name: string,
	status: "ok" | "failed",
	elapsedMs: number | null,
): ChatStreamStep[] => {
	const index = lastOpenIndex(steps, name)
	if (index === -1)
		return [
			...steps,
			{ id: `${name}-${steps.length}`, name, status, elapsedMs },
		]
	return steps.map((s, i) => (i === index ? { ...s, status, elapsedMs } : s))
}

const closeTool = (
	tools: ChatStreamTool[],
	name: string,
	status: string,
	toolMs: number | null,
): ChatStreamTool[] => {
	const index = lastOpenIndex(tools, name)
	if (index === -1) return tools
	return tools.map((t, i) => (i === index ? { ...t, status, toolMs } : t))
}

const errorFromResponse = async (response: Response): Promise<string> => {
	try {
		const parsed: unknown = await response.json()
		const message =
			parsed && typeof parsed === "object"
				? str((parsed as Record<string, unknown>).error)
				: null
		return message ?? m.stream_failed()
	} catch {
		return m.stream_failed()
	}
}

export const useChatStream = (): UseChatStreamReturn => {
	const [state, setState] = useState<ChatStreamState>(idleState)
	const abortRef = useRef<AbortController | null>(null)

	useEffect(() => () => abortRef.current?.abort(), [])

	const reset = useCallback(() => setState(idleState()), [])

	const stop = useCallback(() => abortRef.current?.abort(), [])

	const start = useCallback(
		async (input: ChatStreamInput): Promise<ChatStreamResult> => {
			abortRef.current?.abort()
			const controller = new AbortController()
			abortRef.current = controller
			setState({ ...idleState(), status: "streaming" })

			const run = {
				text: "",
				runId: null as string | null,
				started: false,
				finished: false,
				error: null as string | null,
			}

			const fail = (error: string | null): ChatStreamResult => {
				if (error) setState((prev) => ({ ...prev, status: "error", error }))
				return {
					ok: false,
					runId: run.runId,
					text: run.text,
					error,
					started: run.started,
				}
			}

			const apply = (event: string, data: Record<string, unknown>): void => {
				run.started = true
				switch (event) {
					case "RUN_STARTED": {
						run.runId = str(data.runId)
						setState((prev) => ({
							...prev,
							status: "streaming",
							runId: run.runId,
						}))
						return
					}
					case "STEP_STARTED": {
						const name = str(data.stepName)
						if (!name) return
						setState((prev) => ({
							...prev,
							steps: [
								...prev.steps,
								{
									id: `${name}-${prev.steps.length}`,
									name,
									status: null,
									elapsedMs: null,
								},
							],
						}))
						return
					}
					case "STEP_FINISHED": {
						const name = str(data.stepName)
						if (!name) return
						const status = data.status === "failed" ? "failed" : "ok"
						setState((prev) => ({
							...prev,
							steps: closeStep(prev.steps, name, status, num(data.elapsedMs)),
						}))
						return
					}
					case "TOOL_CALL_START": {
						const name = str(data.toolCallName)
						if (!name) return
						setState((prev) => ({
							...prev,
							tools: [
								...prev.tools,
								{
									id: `${name}-${prev.tools.length}`,
									name,
									provider: str(data.provider),
									status: null,
									toolMs: null,
								},
							],
						}))
						return
					}
					case "TOOL_CALL_END": {
						const name = str(data.toolCallName)
						if (!name) return
						setState((prev) => ({
							...prev,
							tools: closeTool(
								prev.tools,
								name,
								str(data.status) ?? "ok",
								num(data.toolMs),
							),
						}))
						return
					}
					case "TEXT_MESSAGE_START": {
						run.text = ""
						setState((prev) => ({ ...prev, text: "" }))
						return
					}
					case "TEXT_MESSAGE_CONTENT": {
						const delta = str(data.delta)
						if (!delta) return
						run.text += delta
						setState((prev) => ({ ...prev, text: run.text }))
						return
					}
					case "RUN_ERROR": {
						run.error = str(data.message) ?? m.stream_failed()
						return
					}
					case "RUN_FINISHED": {
						run.finished = true
						return
					}
					default:
						return
				}
			}

			const response = await fetch("/api/chat-stream", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					domiaKey: input.domiaKey,
					text: input.text,
					speak: false,
					satelliteId: input.satelliteId,
				}),
				signal: controller.signal,
			}).catch(() => null)

			if (!response) {
				return controller.signal.aborted
					? fail(null)
					: fail(m.stream_unreachable())
			}
			if (!response.ok || !response.body) {
				return fail(await errorFromResponse(response))
			}

			const reader = response.body.getReader()
			const decoder = new TextDecoder()
			let buffer = ""
			try {
				for (;;) {
					const { done, value } = await reader.read()
					if (done) break
					buffer += decoder.decode(value, { stream: true })
					const parts = buffer.split(/\r?\n\r?\n/)
					buffer = parts.pop() ?? ""
					for (const part of parts) {
						const frame = decodeFrame(part)
						if (frame) apply(frame.event, frame.data)
					}
				}
				const tail = decodeFrame(buffer)
				if (tail) apply(tail.event, tail.data)
			} catch {
				return controller.signal.aborted
					? fail(null)
					: fail(m.stream_incomplete())
			}

			if (run.error) return fail(run.error)
			if (!run.finished) return fail(m.stream_incomplete())
			setState((prev) => ({ ...prev, status: "done" }))
			return {
				ok: true,
				runId: run.runId,
				text: run.text,
				error: null,
				started: true,
			}
		},
		[],
	)

	return { state, start, stop, reset }
}
