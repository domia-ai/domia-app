import { createFileRoute } from "@tanstack/react-router"
import { parseTableParams } from "@/utils/table-params"
import { exportInteractions } from "@/services/conversations"
import { tableParamsSchema } from "@/schemas/server"
import { CONVERSATION_FILTER_KEYS } from "@/constants/conversations"

export const Route = createFileRoute("/api/conversations/export")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const sp = new URL(request.url).searchParams
				const params = tableParamsSchema.parse(
					parseTableParams(
						(k) => sp.get(k) ?? undefined,
						CONVERSATION_FILTER_KEYS,
					),
				)
				const rows = await exportInteractions(params)
				const body = rows.map((r) => JSON.stringify(r)).join("\n")
				return new Response(body, {
					headers: {
						"Content-Type": "application/x-ndjson",
						"Content-Disposition": 'attachment; filename="conversations.jsonl"',
					},
				})
			},
		},
	},
})
