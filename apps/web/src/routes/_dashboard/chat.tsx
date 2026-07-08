import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { Card, CardContent } from "@/components/ui/card"
import { ChatConsole } from "@/components/chat/chat-console"
import { getMeshDomiasFn } from "@/server/overview"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/chat")({
	validateSearch: (search: Record<string, unknown>) => ({
		domia: typeof search.domia === "string" ? search.domia : undefined,
	}),
	head: () => ({ meta: [{ title: m.meta_title({ page: m.nav_chat() }) }] }),
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
				title={m.nav_chat()}
				description={m.route_chat_description()}
			/>
			{domias.length ? (
				<>
					<ChatConsole domias={domias} initialKey={initialKey} />
				</>
			) : (
				<Card>
					<CardContent className="text-muted-foreground py-12 text-center text-sm">
						{m.settings_no_domias()}
					</CardContent>
				</Card>
			)}
		</div>
	)
}
