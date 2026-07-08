import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { SettingsView } from "@/components/settings/settings-view"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/settings")({
	head: () => ({ meta: [{ title: m.meta_title({ page: m.nav_settings() }) }] }),
	component: SettingsPage,
})

function SettingsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title={m.nav_settings()}
				description={m.route_settings_description()}
			/>
			<SettingsView />
		</div>
	)
}
