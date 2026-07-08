import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { ConversationsTable } from "@/components/conversations/conversations-table"
import { ConversationStatsHeader } from "@/components/conversations/conversation-stats"
import { validateTableSearch } from "@/utils/table-params"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/conversations/")({
	validateSearch: validateTableSearch,
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.nav_conversations() }) }],
	}),
	component: ConversationsPage,
})

function ConversationsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title={m.nav_conversations()}
				description={m.route_conversations_description()}
			/>
			<ConversationStatsHeader />
			<ConversationsTable />
		</div>
	)
}
