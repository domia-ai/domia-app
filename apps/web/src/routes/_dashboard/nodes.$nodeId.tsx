import { createFileRoute, Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Settings2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/shell/page-header"
import { StatusPill } from "@/components/domia/status"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { AddIdentityDialog } from "@/components/nodes/add-identity-dialog"
import { SatellitesPanel } from "@/components/nodes/satellites-panel"
import { RemoveIdentityButton } from "@/components/nodes/remove-identity-button"
import { RestartButton } from "@/components/domia/restart-button"
import { nodeQueryOptions } from "@/server/nodes"
import type { NodeIdentitySummary } from "@/types/nodes"

export const Route = createFileRoute("/_dashboard/nodes/$nodeId")({
	head: () => ({ meta: [{ title: "Node | Domia Console" }] }),
	component: NodeDetailPage,
})

function IdentityRow({
	identity,
	anchorDomiaKey,
	nodeId,
	removable,
}: {
	identity: NodeIdentitySummary
	anchorDomiaKey: string
	nodeId: string
	removable: boolean
}) {
	return (
		<div className="flex items-center gap-3 border-t py-3 first:border-t-0">
			<PersonaAvatar
				domiaKey={identity.domiaKey}
				name={identity.name}
				avatarId={identity.avatarId}
				size="sm"
			/>
			<div className="min-w-0 flex-1 space-y-1">
				<div className="flex items-center gap-2">
					<span className="truncate font-medium">{identity.name}</span>
					<StatusPill online={identity.online} />
					<Badge
						variant={identity.isPrincipal ? "default" : "secondary"}
						className="capitalize"
					>
						{identity.role}
					</Badge>
				</div>
				<span className="text-muted-foreground font-mono text-xs">
					{identity.domiaKey}
				</span>
			</div>
			<div className="flex items-center gap-2">
				<Button
					variant="outline"
					size="sm"
					render={
						<Link to="/domias/$key/config" params={{ key: identity.domiaKey }}>
							<Settings2 className="size-4" />
							Configure
						</Link>
					}
				/>
				{removable && (
					<RemoveIdentityButton
						anchorDomiaKey={anchorDomiaKey}
						domiaKey={identity.domiaKey}
						name={identity.name}
						nodeId={nodeId}
						online={identity.online}
					/>
				)}
			</div>
		</div>
	)
}

function NodeDetailPage() {
	const { nodeId } = Route.useParams()
	const { data: node, isLoading, isError } = useQuery(nodeQueryOptions(nodeId))

	if (isLoading)
		return <p className="text-muted-foreground text-sm">Loading…</p>
	if (isError || !node)
		return <p className="text-destructive text-sm">Node not found.</p>

	const anchor =
		node.hosted.find((i) => i.isPrincipal)?.domiaKey ??
		node.hosted[0]?.domiaKey ??
		""

	return (
		<div className="space-y-6">
			<PageHeader
				title={node.principalName ?? "Node"}
				description={`${node.localIp}:${node.httpPort}`}
				actions={
					anchor ? (
						<div className="flex items-center gap-2">
							{!node.online && node.identities.length > 0 && (
								<Badge
									variant="outline"
									className="text-muted-foreground gap-1.5"
								>
									<span className="bg-muted-foreground size-1.5 animate-pulse rounded-full" />
									Restarting…
								</Badge>
							)}
							<RestartButton
								domiaKey={anchor}
								domiaName={node.principalName ?? "this node"}
								online={node.online}
							/>
							<AddIdentityDialog anchorDomiaKey={anchor} nodeId={nodeId} />
						</div>
					) : undefined
				}
			/>

			<Card>
				<CardHeader>
					<CardTitle>Hosted identities</CardTitle>
				</CardHeader>
				<CardContent>
					{node.hosted.length === 0 ? (
						<p className="text-muted-foreground text-sm">None.</p>
					) : (
						node.hosted.map((identity) => (
							<IdentityRow
								key={identity.domiaKey}
								identity={identity}
								anchorDomiaKey={anchor}
								nodeId={nodeId}
								removable={!identity.isPrincipal}
							/>
						))
					)}
				</CardContent>
			</Card>

			{node.hosted.length > 0 && (
				<SatellitesPanel
					anchorDomiaKey={anchor}
					nodeId={nodeId}
					hosted={node.hosted}
				/>
			)}

			{node.peers.length > 0 && (
				<Card>
					<CardHeader>
						<CardTitle>Discovered peers</CardTitle>
					</CardHeader>
					<CardContent>
						{node.peers.map((identity) => (
							<div
								key={identity.domiaKey}
								className="flex items-center gap-3 border-t py-3 first:border-t-0"
							>
								<PersonaAvatar
									domiaKey={identity.domiaKey}
									name={identity.name}
									avatarId={identity.avatarId}
									size="sm"
								/>
								<div className="min-w-0 flex-1">
									<span className="truncate font-medium">{identity.name}</span>
									<span className="text-muted-foreground ml-2 font-mono text-xs">
										{identity.domiaKey}
									</span>
								</div>
								<Badge variant="outline">peer</Badge>
							</div>
						))}
					</CardContent>
				</Card>
			)}
		</div>
	)
}
