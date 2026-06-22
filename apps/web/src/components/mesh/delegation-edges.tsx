import { ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { MeshCapability, MeshEdge } from "@/types/mesh"

type Grouped = {
	from: string
	to: string
	crossHost: boolean
	caps: MeshCapability[]
	count: number
}

const groupEdges = (edges: MeshEdge[]): Grouped[] => {
	const map = new Map<string, Grouped>()
	for (const e of edges) {
		const key = `${e.from}→${e.to}`
		const g = map.get(key) ?? {
			from: e.from,
			to: e.to,
			crossHost: e.crossHost,
			caps: [],
			count: 0,
		}
		if (!g.caps.includes(e.capability)) g.caps.push(e.capability)
		g.count += e.count
		map.set(key, g)
	}
	return [...map.values()].sort((a, b) => b.count - a.count)
}

export function DelegationEdges({
	edges,
	nameOf,
}: {
	edges: MeshEdge[]
	nameOf: (key: string) => string
}) {
	const grouped = groupEdges(edges)

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Delegation routing</CardTitle>
			</CardHeader>
			<CardContent>
				{grouped.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						No delegation observed — every identity runs its own pipeline.
					</p>
				) : (
					<div className="space-y-2">
						{grouped.map((g) => (
							<div
								key={`${g.from}-${g.to}`}
								className="flex items-center gap-2 text-sm"
							>
								<span className="font-medium">{nameOf(g.from)}</span>
								<ArrowRight className="text-muted-foreground size-4" />
								<span className="font-medium">{nameOf(g.to)}</span>
								<div className="flex gap-1">
									{g.caps.map((c) => (
										<Badge key={c} variant="outline" className="text-[10px]">
											{c}
										</Badge>
									))}
								</div>
								<Badge
									variant={g.crossHost ? "default" : "secondary"}
									className="ml-auto text-[10px]"
								>
									{g.crossHost ? "cross-hub" : "same-hub"}
								</Badge>
								<span className="text-muted-foreground font-mono text-xs">
									×{g.count}
								</span>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
