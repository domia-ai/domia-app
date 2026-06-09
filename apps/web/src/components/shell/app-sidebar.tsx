import { Link, useLocation } from "@tanstack/react-router"
import {
	BarChart3,
	Boxes,
	BrainCircuit,
	HeartPulse,
	LayoutDashboard,
	LayoutTemplate,
	MessageSquareText,
	MessagesSquare,
	Network,
	Settings,
} from "lucide-react"
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar"
import type { NavItem } from "@/types"

const NAV: NavItem[] = [
	{ href: "/", label: "Overview", icon: LayoutDashboard },
	{ href: "/domias", label: "Domias", icon: Network },
	{ href: "/templates", label: "Templates", icon: LayoutTemplate },
	{ href: "/conversations", label: "Conversations", icon: MessagesSquare },
	{ href: "/chat", label: "Chat", icon: MessageSquareText },
	{ href: "/emotions", label: "Emotions", icon: HeartPulse },
	{ href: "/memories", label: "Memories", icon: BrainCircuit },
	{ href: "/skills", label: "Skills", icon: Boxes },
	{ href: "/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/settings", label: "Settings", icon: Settings },
]

const isActive = (pathname: string, href: string | undefined) =>
	href === "/"
		? pathname === "/"
		: !!href && (pathname === href || pathname.startsWith(href + "/"))

export function AppSidebar({ propertyName }: { propertyName: string }) {
	const pathname = useLocation({ select: (l) => l.pathname })

	return (
		<Sidebar>
			<SidebarHeader>
				<div className="flex items-center gap-2.5 px-2 py-1.5">
					<span className="bg-sidebar-accent flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
						<img
							src="/domia.webp"
							alt="Domia"
							width={36}
							height={36}
							className="size-8 object-contain"
						/>
					</span>
					<div className="leading-tight">
						<p className="text-sm font-semibold tracking-tight">Domia Mesh</p>
						<p className="text-muted-foreground text-xs">{propertyName}</p>
					</div>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						{NAV.map((item) => {
							const Icon = item.icon
							return (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										render={<Link to={item.href} />}
										isActive={isActive(pathname, item.href)}
										tooltip={item.label}
									>
										<Icon />
										<span>{item.label}</span>
									</SidebarMenuButton>
								</SidebarMenuItem>
							)
						})}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<p className="text-muted-foreground px-2 py-1 text-xs">
					Mesh Console v1.0
				</p>
			</SidebarFooter>
		</Sidebar>
	)
}
