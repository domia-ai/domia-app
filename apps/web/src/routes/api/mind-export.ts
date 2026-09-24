import { createFileRoute } from "@tanstack/react-router"
import { exportMind } from "@/services/mind-transfer"
import { mindSectionListSchema } from "@/schemas/mind-transfer"

const safeName = (domiaKey: string): string =>
	domiaKey.replace(/[^A-Za-z0-9_-]/g, "_")

const fileName = (domiaKey: string): string =>
	`mind-${safeName(domiaKey)}-${new Date().toISOString().slice(0, 10)}.json`

export const Route = createFileRoute("/api/mind-export")({
	server: {
		handlers: {
			GET: async ({ request }) => {
				const sp = new URL(request.url).searchParams
				const domiaKey = sp.get("domia")
				if (!domiaKey)
					return Response.json({ error: "Missing domia" }, { status: 400 })
				const raw = sp.get("sections")
				const sections = raw
					? mindSectionListSchema.safeParse(
							raw
								.split(",")
								.map((s) => s.trim())
								.filter(Boolean),
						)
					: null
				if (sections && !sections.success)
					return Response.json({ error: "Invalid sections" }, { status: 400 })
				const result = await exportMind({
					domiaKey,
					sections: sections?.data,
				})
				if (!result.ok)
					return Response.json({ error: result.error }, { status: 502 })
				return new Response(JSON.stringify(result.data, null, 2), {
					headers: {
						"Content-Type": "application/json",
						"Content-Disposition": `attachment; filename="${fileName(domiaKey)}"`,
						"Cache-Control": "no-store",
					},
				})
			},
		},
	},
})
