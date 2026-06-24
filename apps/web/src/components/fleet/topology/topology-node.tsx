import { Crown, Server } from "lucide-react"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { StatusDot } from "@/components/domia/status"
import { cn } from "@/lib/utils"
import type { FleetGraphIdentity, FleetGraphNode } from "@/types/fleet"
import type { PresenceStatus } from "@/types/rooms"

const STATUS_COLOR: Record<PresenceStatus, string> = {
	idle: "bg-muted-foreground/30",
	listening: "bg-sky-500",
	thinking: "bg-amber-500",
	speaking: "bg-emerald-500",
}

export function TopologyNode({
	node,
	statusOf,
	onSelectNode,
	onSelectIdentity,
	onHover,
}: {
	node: FleetGraphNode
	statusOf: (domiaKey: string) => PresenceStatus
	onSelectNode: (nodeId: string) => void
	onSelectIdentity: (domiaKey: string) => void
	onHover: (nodeId: string | null) => void
}) {
	return (
		<div
			onMouseEnter={() => onHover(node.nodeId)}
			onMouseLeave={() => onHover(null)}
			className="bg-card ring-foreground/10 w-48 rounded-xl p-3 shadow-sm ring-1"
		>
			<button
				type="button"
				onClick={() => onSelectNode(node.nodeId)}
				className="hover:text-primary flex w-full items-center gap-2 text-left transition-colors"
			>
				<Server className="text-muted-foreground size-4 shrink-0" />
				<span className="flex-1 truncate text-sm font-semibold">
					{node.name}
				</span>
				<StatusDot online={node.online} />
			</button>
			<p className="text-muted-foreground mt-0.5 font-mono text-[10px]">
				{node.localIp ? `${node.localIp}:${node.httpPort}` : node.nodeId}
			</p>
			<div className="mt-2 space-y-0.5">
				{node.identities.map((id: FleetGraphIdentity) => {
					const status = statusOf(id.domiaKey)
					const active = status !== "idle"
					return (
						<button
							type="button"
							key={id.domiaKey}
							onClick={() => onSelectIdentity(id.domiaKey)}
							className="hover:bg-muted/60 flex w-full items-center gap-1.5 rounded-md px-1 py-1 text-left transition-colors"
						>
							<span className="relative shrink-0">
								<PersonaAvatar
									domiaKey={id.domiaKey}
									name={id.name}
									avatarId={id.avatarId}
									size="sm"
								/>
								{active ? (
									<span
										className={cn(
											"animate-domia-pulse absolute -inset-0.5 rounded-full ring-2",
											status === "speaking"
												? "ring-emerald-500"
												: status === "thinking"
													? "ring-amber-500"
													: "ring-sky-500",
										)}
									/>
								) : null}
							</span>
							<span className="min-w-0 flex-1 truncate text-xs font-medium">
								{id.name}
							</span>
							{id.isPrincipal ? (
								<Crown className="size-3 shrink-0 text-amber-500" />
							) : null}
							<span
								className={cn(
									"size-1.5 shrink-0 rounded-full",
									STATUS_COLOR[status],
								)}
							/>
						</button>
					)
				})}
			</div>
		</div>
	)
}
