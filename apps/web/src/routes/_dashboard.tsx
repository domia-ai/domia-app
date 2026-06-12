import { Outlet, createFileRoute } from "@tanstack/react-router"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/shell/app-sidebar"
import { SiteHeader } from "@/components/shell/site-header"
import { DemoBanner } from "@/components/shell/demo-banner"
import { isDemoMode } from "@/lib/demo"
import { getShellDataFn } from "@/server/app"

export const Route = createFileRoute("/_dashboard")({
	loader: () => getShellDataFn(),
	component: DashboardLayout,
})

function DashboardLayout() {
	const { stats, propertyName } = Route.useLoaderData()
	const demoMode = isDemoMode()

	return (
		<SidebarProvider>
			<AppSidebar propertyName={propertyName} />
			<SidebarInset>
				<SiteHeader stats={stats} demoMode={demoMode} />
				{demoMode && <DemoBanner />}
				<div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 md:px-6">
					<Outlet />
				</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
