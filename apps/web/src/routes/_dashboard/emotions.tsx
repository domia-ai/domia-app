import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { ComingSoon } from "@/components/shell/coming-soon"

export const Route = createFileRoute("/_dashboard/emotions")({
	head: () => ({ meta: [{ title: "Emotions | Domia Console" }] }),
	component: EmotionsPage,
})

function EmotionsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Emotions"
				description="Mood trends and the Plutchik-8 fingerprint per Domia."
			/>
			<ComingSoon />
		</div>
	)
}
