import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { EmotionsView } from "@/components/emotions/emotions-view"

export const Route = createFileRoute("/_dashboard/emotions")({
	head: () => ({ meta: [{ title: "Emotions | Domia Console" }] }),
	component: EmotionsPage,
})

function EmotionsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Emotions"
				description="Pick a Domia to see its mood right now and how it shifts as it talks with you."
			/>
			<EmotionsView />
		</div>
	)
}
