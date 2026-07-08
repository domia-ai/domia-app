import { m } from "@/paraglide/messages"
import { useMemo, useState } from "react"
import type { MeshDomiaRow } from "@/types/fleet"
import { accentFor } from "@/utils/accent"
import { initials } from "@/utils/initials"
import { isOnline } from "@/utils/presence"
import {
	customAvatarSrc,
	isCustomAvatar,
	isPresetAvatar,
	presetSrc,
} from "@/constants/avatars"
import type { MeshEdge } from "@/types"

const avatarSrc = (
	domiaKey: string,
	avatarId: string | null | undefined,
): string | null =>
	isPresetAvatar(avatarId)
		? presetSrc(avatarId as string)
		: isCustomAvatar(avatarId)
			? customAvatarSrc(domiaKey)
			: null

type MeshNode = {
	row: MeshDomiaRow
	x: number
	y: number
	isHub: boolean
}

const W = 560
const H = 440
const CX = W / 2
const CY = H / 2

export function MeshMap({
	rows,
	edges,
	selectedKey,
	onSelect,
}: {
	rows: MeshDomiaRow[]
	edges: MeshEdge[]
	selectedKey?: string
	onSelect?: (key: string) => void
}) {
	const [hovered, setHovered] = useState<string | null>(null)

	const nodes = useMemo<MeshNode[]>(() => {
		const inbound: Record<string, number> = {}
		for (const edge of edges)
			inbound[edge.target] = (inbound[edge.target] ?? 0) + 1
		const hubKey =
			Object.entries(inbound).sort((a, b) => b[1] - a[1])[0]?.[0] ??
			rows[0]?.domiaKey

		const spokes = rows.filter((row) => row.domiaKey !== hubKey)
		const radius = Math.min(W, H) / 2 - 80
		const out: MeshNode[] = []
		const hub = rows.find((row) => row.domiaKey === hubKey)
		if (hub) out.push({ row: hub, x: CX, y: CY, isHub: edges.length > 0 })
		spokes.forEach((row, i) => {
			const angle = (i / spokes.length) * Math.PI * 2 - Math.PI / 2
			out.push({
				row,
				x: CX + Math.cos(angle) * radius,
				y: CY + Math.sin(angle) * radius,
				isHub: false,
			})
		})
		return out
	}, [rows, edges])

	const pos = (key: string) => nodes.find((node) => node.row.domiaKey === key)

	return (
		<div className="w-full">
			<svg
				viewBox={`0 0 ${W} ${H}`}
				className="w-full"
				role="img"
				aria-label={m.aria_mesh_topology()}
			>
				{edges.map((edge, i) => {
					const a = pos(edge.source)
					const b = pos(edge.target)
					if (!a || !b) return null
					const active =
						hovered === edge.source ||
						hovered === edge.target ||
						selectedKey === edge.source ||
						selectedKey === edge.target
					return (
						<g key={`${edge.source}-${edge.target}-${edge.capability}-${i}`}>
							<line
								x1={a.x}
								y1={a.y}
								x2={b.x}
								y2={b.y}
								stroke="var(--border)"
								strokeWidth={active ? 2 : 1.25}
								strokeOpacity={active ? 0.9 : 0.4}
								strokeDasharray="4 4"
								className="transition-all"
							/>
							{active && (
								<line
									x1={a.x}
									y1={a.y}
									x2={b.x}
									y2={b.y}
									stroke="var(--primary)"
									strokeWidth={2}
									strokeOpacity={0.9}
									strokeDasharray="2 6"
									strokeLinecap="round"
									className="animate-domia-flow"
								/>
							)}
						</g>
					)
				})}

				{nodes.map((node) => {
					const online = isOnline(node.row.lastSeenAt)
					const config = node.row.config
					const accent = accentFor(node.row.domiaKey)
					const selected = selectedKey === node.row.domiaKey
					const r = node.isHub ? 34 : 26
					return (
						<g
							key={node.row.domiaKey}
							transform={`translate(${node.x}, ${node.y})`}
							className="cursor-pointer"
							onMouseEnter={() => setHovered(node.row.domiaKey)}
							onMouseLeave={() => setHovered(null)}
							onClick={() => onSelect?.(node.row.domiaKey)}
						>
							{online && (
								<circle
									r={r + 6}
									fill="none"
									stroke="var(--success)"
									strokeWidth={1.5}
									strokeOpacity={0.5}
									className="animate-domia-pulse"
								/>
							)}
							<circle
								r={r}
								fill={accent}
								fillOpacity={online ? 0.95 : 0.3}
								stroke={selected ? "var(--foreground)" : "var(--card)"}
								strokeWidth={selected ? 3 : 2}
							/>
							{avatarSrc(node.row.domiaKey, node.row.avatarId) ? (
								<foreignObject
									x={-r}
									y={-r}
									width={r * 2}
									height={r * 2}
									className="pointer-events-none"
								>
									<img
										src={
											avatarSrc(node.row.domiaKey, node.row.avatarId) as string
										}
										alt={node.row.name}
										className="size-full rounded-full object-cover"
									/>
								</foreignObject>
							) : (
								<text
									textAnchor="middle"
									dy="0.35em"
									className="pointer-events-none font-semibold"
									fontSize={node.isHub ? 15 : 12}
									fill="white"
								>
									{initials(node.row.name)}
								</text>
							)}
							<text
								textAnchor="middle"
								y={r + 16}
								className="pointer-events-none font-medium"
								fontSize={11}
								fill="var(--foreground)"
							>
								{node.row.name}
							</text>
							<text
								textAnchor="middle"
								y={r + 30}
								className="pointer-events-none"
								fontSize={9}
								fill="var(--muted-foreground)"
							>
								{node.isHub
									? "Hub"
									: config.runtimeCapabilities?.llm
										? "Edge AI"
										: "Thin client"}
							</text>
						</g>
					)
				})}
			</svg>

			<div className="text-muted-foreground mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs">
				<span className="flex items-center gap-1.5">
					<span className="bg-success size-2.5 rounded-full" />{" "}
					{m.mesh_online()}
				</span>
				<span className="flex items-center gap-1.5">
					<span className="bg-muted-foreground/40 size-2.5 rounded-full" />{" "}
					{m.mesh_offline()}
				</span>
				<span className="flex items-center gap-1.5">
					<span className="border-muted-foreground inline-block h-0 w-5 border-t border-dashed" />{" "}
					{m.mesh_capability_delegation()}
				</span>
			</div>
		</div>
	)
}
