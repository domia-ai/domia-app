import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Workflow } from "lucide-react"
import { TopologyNode } from "./topology-node"
import { computeLayout } from "./layout"
import { fleetGraphQueryOptions } from "@/server/fleet"
import { livePresenceQueryOptions } from "@/server/live"
import { cn } from "@/lib/utils"
import type { PresenceStatus } from "@/types/rooms"

const pct = (value: number, total: number) => `${(value / total) * 100}%`

export function FleetTopology() {
	const navigate = useNavigate()
	const { data, isLoading, isError } = useQuery(fleetGraphQueryOptions())
	const presence = useQuery(livePresenceQueryOptions())
	const [hovered, setHovered] = useState<string | null>(null)

	if (isLoading)
		return <p className="text-muted-foreground text-sm">Loading…</p>
	if (isError || !data?.ok)
		return (
			<p className="text-destructive text-sm">
				{(data && !data.ok && data.error) || "Could not load topology."}
			</p>
		)

	const graph = data.data
	if (!graph || graph.nodes.length === 0)
		return (
			<div className="text-muted-foreground flex flex-col items-center gap-2 py-16 text-center text-sm">
				<Workflow className="size-8 opacity-40" />
				<p>No nodes discovered yet.</p>
			</div>
		)

	const layout = computeLayout(graph)

	const statusByKey = new Map<string, PresenceStatus>()
	if (presence.data?.ok)
		for (const node of presence.data.data ?? [])
			for (const entry of node.entries)
				statusByKey.set(entry.domiaKey, entry.status)

	const activeNodes = new Set<string>()
	for (const node of graph.nodes)
		if (
			node.identities.some(
				(id) => (statusByKey.get(id.domiaKey) ?? "idle") !== "idle",
			)
		)
			activeNodes.add(node.nodeId)

	const statusOf = (domiaKey: string): PresenceStatus =>
		statusByKey.get(domiaKey) ?? "idle"

	return (
		<>
			<div className="overflow-x-auto">
				<div
					className="bg-muted/20 relative min-w-[900px] rounded-xl border"
					style={{ aspectRatio: `${layout.width} / ${layout.height}` }}
				>
					<svg
						viewBox={`0 0 ${layout.width} ${layout.height}`}
						preserveAspectRatio="none"
						className="absolute inset-0 h-full w-full"
					>
						<defs>
							<marker
								id="topology-arrow"
								viewBox="0 0 10 10"
								refX="9"
								refY="5"
								markerWidth="6"
								markerHeight="6"
								orient="auto-start-reverse"
							>
								<path
									d="M 0 0 L 10 5 L 0 10 z"
									className="fill-muted-foreground"
								/>
							</marker>
						</defs>
						{layout.edges.map((edge) => {
							const dim =
								hovered !== null && hovered !== edge.from && hovered !== edge.to
							const flowing = activeNodes.has(edge.from)
							return (
								<g key={edge.id} opacity={dim ? 0.15 : 1}>
									<path
										d={edge.path}
										fill="none"
										markerEnd="url(#topology-arrow)"
										className="stroke-muted-foreground/40"
										strokeWidth={2.5}
									/>
									{flowing ? (
										<path
											d={edge.path}
											fill="none"
											strokeDasharray="2 6"
											strokeWidth={2.5}
											className="stroke-primary animate-domia-flow"
										/>
									) : null}
								</g>
							)
						})}
					</svg>

					{layout.edges.map((edge) => {
						const dim =
							hovered !== null && hovered !== edge.from && hovered !== edge.to
						return (
							<span
								key={edge.id}
								className={cn(
									"bg-background text-muted-foreground pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-1.5 py-0.5 font-mono text-[10px] whitespace-nowrap transition-opacity",
									dim && "opacity-15",
								)}
								style={{
									left: pct(edge.mid.x, layout.width),
									top: pct(edge.mid.y, layout.height),
								}}
							>
								{edge.caps.join(" · ")}
							</span>
						)
					})}

					{layout.nodes.map((ln) => {
						const node = graph.nodes.find((n) => n.nodeId === ln.nodeId)
						if (!node) return null
						return (
							<div
								key={ln.nodeId}
								className="absolute -translate-x-1/2 -translate-y-1/2"
								style={{
									left: pct(ln.center.x, layout.width),
									top: pct(ln.center.y, layout.height),
								}}
							>
								<TopologyNode
									node={node}
									statusOf={statusOf}
									onSelectNode={(nodeId) =>
										navigate({ to: "/nodes/$nodeId", params: { nodeId } })
									}
									onSelectIdentity={(domiaKey) =>
										navigate({ to: "/domias/$key", params: { key: domiaKey } })
									}
									onHover={setHovered}
								/>
							</div>
						)
					})}
				</div>
			</div>
		</>
	)
}
