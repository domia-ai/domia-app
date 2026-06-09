import { createFileRoute } from "@tanstack/react-router"
import { getNodeEndpoint } from "@/services/fleet"
import { env } from "@/config"

export const Route = createFileRoute("/api/node-audio")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const sp = new URL(request.url).searchParams
				const domia = sp.get("domia")
				const id = sp.get("id")
				const kind = sp.get("kind")
				if (!domia || !id) {
					return Response.json(
						{ error: "Missing domia or id" },
						{ status: 400 },
					)
				}
				if (kind !== "input" && kind !== "tts") {
					return Response.json({ error: "Invalid kind" }, { status: 400 })
				}

				const endpoint = await getNodeEndpoint(domia)
				if (!endpoint) {
					return Response.json({ error: "Domia unreachable" }, { status: 404 })
				}

				let upstream: Response
				try {
					upstream = await fetch(
						`http://${endpoint.localIp}:${endpoint.httpPort}/audio/${encodeURIComponent(id)}?kind=${kind}`,
						{ signal: AbortSignal.timeout(env.DOMIA_NODE_TIMEOUT_MS) },
					)
				} catch {
					return Response.json({ error: "Domia unreachable" }, { status: 504 })
				}
				if (!upstream.ok || !upstream.body) {
					return Response.json({ error: "Audio not found" }, { status: 404 })
				}

				const headers = new Headers({ "Cache-Control": "no-store" })
				headers.set(
					"Content-Type",
					upstream.headers.get("Content-Type") ?? "audio/wav",
				)
				const contentLength = upstream.headers.get("Content-Length")
				if (contentLength) headers.set("Content-Length", contentLength)
				return new Response(upstream.body, { headers })
			},
		},
	},
})
