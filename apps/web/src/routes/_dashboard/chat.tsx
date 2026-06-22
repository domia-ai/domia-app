import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { ChatConsole } from "@/components/chat/chat-console"
import { RoomsPanel } from "@/components/rooms/rooms-panel"
import { getMeshDomiasFn } from "@/server/overview"

export const Route = createFileRoute("/_dashboard/chat")({
	validateSearch: (search: Record<string, unknown>) => ({
		domia: typeof search.domia === "string" ? search.domia : undefined,
	}),
	head: () => ({ meta: [{ title: "Chat | Domia Console" }] }),
	loader: () => getMeshDomiasFn(),
	component: ChatPage,
})

function ChatPage() {
	const domias = Route.useLoaderData()
	const { domia } = Route.useSearch()
	const initialKey =
		domia && domias.some((d) => d.domiaKey === domia)
			? domia
			: (domias[0]?.domiaKey ?? "")

	return (
		<div className="space-y-6">
			<PageHeader
				title="Chat"
				description="Talk to any Domia — text or voice, any mode, no mic needed. Every exchange is a real interaction."
			/>
			{domias.length ? (
				<>
					<ChatConsole domias={domias} initialKey={initialKey} />
					<RoomsPanel domias={domias} />
				</>
			) : (
				<Card>
					<CardContent className="text-muted-foreground py-12 text-center text-sm">
						No Domias discovered yet.
					</CardContent>
				</Card>
			)}
		</div>
	)
}
