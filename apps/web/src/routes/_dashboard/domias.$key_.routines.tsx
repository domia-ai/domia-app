import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { RoutinesManager } from "@/components/routines/routines-manager"
import { getDomiaFn } from "@/server/domia"
import { isOnline } from "@/utils/presence"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_dashboard/domias/$key_/routines")({
	loader: async ({ params }) => {
		const domia = await getDomiaFn({ data: params.key })
		if (!domia) throw notFound()
		return { domia }
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: m.meta_title({
					page: m.routine_route_title({
						name: loaderData?.domia.name ?? "Domia",
					}),
				}),
			},
		],
	}),
	component: RoutinesPage,
})

function RoutinesPage() {
	const { domia } = Route.useLoaderData()
	const online = isOnline(domia.lastSeenAt)

	return (
		<div className="space-y-6">
			<Link
				to="/domias/$key"
				params={{ key: domia.domiaKey }}
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeft className="size-4" />
				{domia.name}
			</Link>

			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					{m.routine_page_title()}
				</h1>
				<div className="text-muted-foreground flex items-center gap-2 text-sm">
					<span
						className={cn(
							"size-2 rounded-full",
							online ? "bg-emerald-500" : "bg-muted-foreground/40",
						)}
					/>
					<span>{online ? m.routine_online() : m.routine_offline()}</span>
					<span>·</span>
					<Badge variant="secondary" className="font-mono text-xs">
						{domia.domiaKey}
					</Badge>
				</div>
			</div>

			{!online ? (
				<p className="text-muted-foreground rounded-lg border border-dashed px-4 py-2.5 text-sm">
					{m.routine_offline_note()}
				</p>
			) : null}

			<RoutinesManager domiaKey={domia.domiaKey} online={online} />
		</div>
	)
}
