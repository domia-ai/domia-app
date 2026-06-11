import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { SettingsView } from "@/components/settings/settings-view"

export const Route = createFileRoute("/_dashboard/settings")({
	head: () => ({ meta: [{ title: "Settings | Domia Console" }] }),
	component: SettingsPage,
})

function SettingsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Settings"
				description="Console preferences, sync status and local data."
			/>
			<SettingsView />
		</div>
	)
}
