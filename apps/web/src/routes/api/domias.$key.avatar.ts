import { createFileRoute } from "@tanstack/react-router"
import { getDomiaAvatar } from "@/services/avatars"

export const Route = createFileRoute("/api/domias/$key/avatar")({
	server: {
		handlers: {
			GET: async ({ params }) => {
				const avatar = await getDomiaAvatar(params.key)
				if (!avatar) return new Response("Not found", { status: 404 })
				return new Response(new Uint8Array(avatar.data), {
					headers: {
						"Content-Type": avatar.mime,
						"Cache-Control": "no-cache",
						"Content-Length": String(avatar.data.length),
					},
				})
			},
		},
	},
})
