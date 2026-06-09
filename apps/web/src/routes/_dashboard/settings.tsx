import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { ComingSoon } from "@/components/shell/coming-soon"

export const Route = createFileRoute("/_dashboard/settings")({
	head: () => ({ meta: [{ title: "Settings | Domia Console" }] }),
	component: SettingsPage,
})

function SettingsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Settings"
				description="Console preferences and local data."
			/>
			<ComingSoon />
		</div>
	)
}
