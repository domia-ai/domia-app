import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { ConversationsTable } from "@/components/conversations/conversations-table"
import { ConversationStatsHeader } from "@/components/conversations/conversation-stats"
import { validateTableSearch } from "@/utils/table-params"

export const Route = createFileRoute("/_dashboard/conversations/")({
	validateSearch: validateTableSearch,
	head: () => ({ meta: [{ title: "Conversations | Domia Console" }] }),
	component: ConversationsPage,
})

function ConversationsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Conversations"
				description="Every interaction across the mesh — transcripts, replies, audio and grading."
			/>
			<ConversationStatsHeader />
			<ConversationsTable />
		</div>
	)
}
