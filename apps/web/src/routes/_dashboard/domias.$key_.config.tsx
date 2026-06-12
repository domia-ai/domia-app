import { Link, createFileRoute, notFound } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ConfigWorkspace } from "@/components/domia/config/config-workspace"
import { RestartButton } from "@/components/domia/restart-button"
import { configQueryOptions } from "@/server/config"
import { getDomiaFn } from "@/server/domia"
import { accentFor } from "@/utils/accent"
import { isOnline } from "@/utils/presence"
import { cn } from "@/lib/utils"

export const Route = createFileRoute("/_dashboard/domias/$key_/config")({
	loader: async ({ params }) => {
		const domia = await getDomiaFn({ data: params.key })
		if (!domia) throw notFound()
		return { domia }
	},
	head: ({ loaderData }) => ({
		meta: [
			{
				title: `Configure ${loaderData?.domia.name ?? "Domia"} | Domia Console`,
			},
		],
	}),
	component: ConfigPage,
})

function ConfigPage() {
	const { domia } = Route.useLoaderData()
	const online = isOnline(domia.lastSeenAt)
	const accent = accentFor(domia.domiaKey)

	const query = useQuery(configQueryOptions(domia.domiaKey))

	const result = query.data
	const failed = query.isError
		? "request failed"
		: result && !result.ok
			? result.error
			: null

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

			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">
						Configuration
					</h1>
					<div className="text-muted-foreground flex items-center gap-2 text-sm">
						<span
							className={cn(
								"size-2 rounded-full",
								online ? "bg-emerald-500" : "bg-muted-foreground/40",
							)}
						/>
						<span>{online ? "Online" : "Offline"}</span>
						<span>·</span>
						<Badge variant="secondary" className="font-mono text-xs">
							{domia.domiaKey}
						</Badge>
					</div>
				</div>
				<div className="ml-auto">
					<RestartButton
						domiaKey={domia.domiaKey}
						domiaName={domia.name}
						online={online}
					/>
				</div>
			</div>

			{query.isLoading ? (
				<div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
					<Loader2 className="size-4 animate-spin" />
					Loading live configuration…
				</div>
			) : failed ? (
				<p className="text-destructive py-16 text-center text-sm">
					Could not load configuration: {failed}
				</p>
			) : result?.ok && result.data ? (
				<>
					{result.source === "snapshot" && (
						<p className="text-muted-foreground rounded-lg border border-dashed px-4 py-2.5 text-sm">
							Showing the last configuration this Domia reported. It is offline,
							so editing is disabled until it comes back.
						</p>
					)}
					<ConfigWorkspace
						domiaKey={domia.domiaKey}
						domiaName={domia.name}
						config={result.data}
						online={online}
						accent={accent}
						readOnly={result.source === "snapshot"}
					/>
				</>
			) : null}
		</div>
	)
}
