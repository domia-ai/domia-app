import { readFile } from "node:fs/promises"
import { createFileRoute } from "@tanstack/react-router"
import { getNodeEndpoint } from "@/services/fleet"
import { getAudioAsset } from "@/services/audio"
import { env } from "@/config"
import { meshHeaders } from "@/lib/node-client"
import { nodeBaseUrl } from "@/utils/node-base"

const NODE_AUDIO_KINDS = ["input", "tts", "announce"] as const

const archivedResponse = async (
	id: string,
	kind: (typeof NODE_AUDIO_KINDS)[number],
): Promise<Response | null> => {
	const asset = await getAudioAsset(id, kind)
	if (!asset) return null
	try {
		const data = await readFile(asset.localPath)
		return new Response(new Uint8Array(data), {
			headers: {
				"Content-Type": "audio/wav",
				"Content-Length": String(data.length),
				"Cache-Control": "no-store",
			},
		})
	} catch {
		return null
	}
}

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
				if (
					!NODE_AUDIO_KINDS.includes(kind as (typeof NODE_AUDIO_KINDS)[number])
				) {
					return Response.json({ error: "Invalid kind" }, { status: 400 })
				}
				const audioKind = kind as (typeof NODE_AUDIO_KINDS)[number]

				const endpoint = await getNodeEndpoint(domia)
				if (endpoint) {
					const upstream = await fetch(
						`${nodeBaseUrl(endpoint)}/audio/${encodeURIComponent(id)}?kind=${audioKind}`,
						{
							headers: meshHeaders(),
							signal: AbortSignal.timeout(env.DOMIA_NODE_TIMEOUT_MS),
						},
					).catch(() => null)
					if (upstream?.ok && upstream.body) {
						const headers = new Headers({ "Cache-Control": "no-store" })
						headers.set(
							"Content-Type",
							upstream.headers.get("Content-Type") ?? "audio/wav",
						)
						const contentLength = upstream.headers.get("Content-Length")
						if (contentLength) headers.set("Content-Length", contentLength)
						return new Response(upstream.body, { headers })
					}
				}

				const archived = await archivedResponse(id, audioKind)
				if (archived) return archived
				return Response.json({ error: "Audio not found" }, { status: 404 })
			},
		},
	},
})
