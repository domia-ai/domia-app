import { readFile } from "node:fs/promises"
import { createFileRoute } from "@tanstack/react-router"
import { getAudioAsset } from "@/services/audio"

export const Route = createFileRoute("/api/audio/$id")({
	server: {
		handlers: {
			GET: async ({ request, params }) => {
				const kind = new URL(request.url).searchParams.get("kind")
				if (kind !== "input" && kind !== "tts") {
					return new Response("Invalid kind", { status: 400 })
				}

				const asset = await getAudioAsset(params.id, kind)
				if (!asset) return new Response("Not found", { status: 404 })

				let data: Buffer
				try {
					data = await readFile(asset.localPath)
				} catch {
					return new Response("Audio file missing", { status: 404 })
				}

				const total = data.length
				const baseHeaders = {
					"Content-Type": "audio/wav",
					"Accept-Ranges": "bytes",
					"Cache-Control": "public, max-age=3600",
				}

				const match = /^bytes=(\d*)-(\d*)$/.exec(
					request.headers.get("range") ?? "",
				)
				if (match) {
					const start = match[1] ? parseInt(match[1], 10) : 0
					const end = Math.min(
						match[2] ? parseInt(match[2], 10) : total - 1,
						total - 1,
					)
					if (start >= total || start > end) {
						return new Response("Range not satisfiable", {
							status: 416,
							headers: { "Content-Range": `bytes */${total}` },
						})
					}
					const chunk = data.subarray(start, end + 1)
					return new Response(new Uint8Array(chunk), {
						status: 206,
						headers: {
							...baseHeaders,
							"Content-Range": `bytes ${start}-${end}/${total}`,
							"Content-Length": String(chunk.length),
						},
					})
				}

				return new Response(new Uint8Array(data), {
					headers: { ...baseHeaders, "Content-Length": String(total) },
				})
			},
		},
	},
})
