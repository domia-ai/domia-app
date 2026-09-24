import { createFileRoute } from "@tanstack/react-router"
import { getNodeEndpoint } from "@/services/fleet"
import { meshHeaders } from "@/lib/node-client"
import { nodeBaseUrl } from "@/utils/node-base"
import { assertWritable } from "@/lib/demo"
import type { ChatStreamRequestBody } from "@/types/chat"

const readBody = async (
	request: Request,
): Promise<ChatStreamRequestBody | null> => {
	try {
		const parsed: unknown = await request.json()
		if (!parsed || typeof parsed !== "object") return null
		const { domiaKey, text, satelliteId } = parsed as Record<string, unknown>
		if (typeof domiaKey !== "string" || domiaKey.trim().length === 0)
			return null
		if (typeof text !== "string" || text.trim().length === 0) return null
		return {
			domiaKey,
			text: text.trim(),
			satelliteId: typeof satelliteId === "string" ? satelliteId : undefined,
		}
	} catch {
		return null
	}
}

export const Route = createFileRoute("/api/chat-stream")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					assertWritable()
				} catch {
					return Response.json({ error: "Demo is read-only" }, { status: 403 })
				}

				const body = await readBody(request)
				if (!body) {
					return Response.json(
						{ error: "Missing domiaKey or text" },
						{ status: 400 },
					)
				}

				const endpoint = await getNodeEndpoint(body.domiaKey)
				if (!endpoint) {
					return Response.json(
						{ error: "This Domia has no reachable address" },
						{ status: 404 },
					)
				}

				const upstream = await fetch(`${nodeBaseUrl(endpoint)}/chat/stream`, {
					method: "POST",
					headers: { ...meshHeaders(), "Content-Type": "application/json" },
					body: JSON.stringify(body),
					signal: request.signal,
				}).catch(() => null)

				if (!upstream) {
					return Response.json({ error: "Node unreachable" }, { status: 502 })
				}
				if (!upstream.ok || !upstream.body) {
					const detail = await upstream.text().catch(() => "")
					return Response.json(
						{ error: detail || `Node refused the stream (${upstream.status})` },
						{ status: 502 },
					)
				}

				return new Response(upstream.body, {
					headers: {
						"Content-Type": "text/event-stream",
						"Cache-Control": "no-store",
					},
				})
			},
		},
	},
})
