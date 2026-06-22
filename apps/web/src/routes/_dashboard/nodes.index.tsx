import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/shell/page-header"
import { StatusPill } from "@/components/domia/status"
import { nodesQueryOptions } from "@/server/nodes"

export const Route = createFileRoute("/_dashboard/nodes/")({
	head: () => ({ meta: [{ title: "Nodes | Domia Console" }] }),
	component: NodesPage,
})

function NodesPage() {
	const { data: nodes, isLoading, isError } = useQuery(nodesQueryOptions())

	return (
		<div className="space-y-6">
			<PageHeader
				title="Nodes"
				description="Each physical Domia node and the identities it hosts."
			/>
			{isLoading && <p className="text-muted-foreground text-sm">Loading…</p>}
			{isError && (
				<p className="text-destructive text-sm">Could not load nodes.</p>
			)}
			{nodes && nodes.length === 0 && (
				<p className="text-muted-foreground text-sm">
					No nodes discovered yet.
				</p>
			)}
			{nodes && nodes.length > 0 && (
				<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{nodes.map((node) => (
						<Link
							key={node.nodeId}
							to="/nodes/$nodeId"
							params={{ nodeId: node.nodeId }}
							className="block focus-visible:outline-none"
						>
							<Card className="hover:border-foreground/20 h-full transition-colors">
								<CardHeader className="flex-row items-center justify-between space-y-0">
									<div className="min-w-0 space-y-1">
										<div className="flex items-center gap-2">
											<span className="truncate font-medium">
												{node.principalName ?? "Node"}
											</span>
											<StatusPill online={node.online} />
										</div>
										<span className="text-muted-foreground font-mono text-xs">
											{node.localIp}:{node.httpPort}
										</span>
									</div>
								</CardHeader>
								<CardContent className="flex flex-wrap gap-1.5">
									<Badge variant="secondary">{node.hostedCount} hosted</Badge>
									{node.peerCount > 0 && (
										<Badge variant="outline">{node.peerCount} peers</Badge>
									)}
									{node.identities
										.filter((i) => i.isHosted)
										.map((i) => (
											<Badge
												key={i.domiaKey}
												variant={i.isPrincipal ? "default" : "outline"}
											>
												{i.name}
											</Badge>
										))}
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
