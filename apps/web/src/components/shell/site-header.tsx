import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import type { FleetStats } from "@/types"
import { CommandMenu } from "./command-menu"
import { ThemeToggle } from "./theme-toggle"

export function SiteHeader({ stats }: { stats: FleetStats }) {
	return (
		<header className="bg-background/80 sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur md:px-6">
			<SidebarTrigger className="-ml-1" />
			<Separator orientation="vertical" className="mr-1 hidden h-5 md:block" />
			<CommandMenu />
			<div className="ml-auto flex items-center gap-3">
				<div className="bg-card hidden items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:flex">
					<span
						className={cn(
							"size-2 rounded-full",
							stats.online > 0 ? "bg-emerald-500" : "bg-muted-foreground/40",
						)}
					/>
					<span>{stats.online} online</span>
					<span className="text-muted-foreground">
						/ {stats.total} discovered
					</span>
				</div>
				<ThemeToggle />
			</div>
		</header>
	)
}
