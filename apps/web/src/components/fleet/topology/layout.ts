import type { FleetGraph } from "@/types/fleet"
import type { GraphLayout, LayoutEdge, Point } from "@/types/topology"

const VIRTUAL_W = 1000
const ROW_H = 300
const PAD_Y = 40

const perRowFor = (n: number) => (n <= 1 ? 1 : n <= 2 ? 2 : 3)

const quadratic = (
	a: Point,
	b: Point,
	sign: number,
): { path: string; mid: Point } => {
	const mx = (a.x + b.x) / 2
	const my = (a.y + b.y) / 2
	const dx = b.x - a.x
	const dy = b.y - a.y
	const len = Math.hypot(dx, dy) || 1
	const off = 44 * sign
	const cx = mx + (-dy / len) * off
	const cy = my + (dx / len) * off
	return {
		path: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}`,
		mid: { x: (a.x + 2 * cx + b.x) / 4, y: (a.y + 2 * cy + b.y) / 4 },
	}
}

export const computeLayout = (graph: FleetGraph): GraphLayout => {
	const n = graph.nodes.length
	const perRow = perRowFor(n)
	const rows = Math.max(1, Math.ceil(n / perRow))

	const centers = new Map<string, Point>()
	const layoutNodes = graph.nodes.map((node, i) => {
		const row = Math.floor(i / perRow)
		const colsInRow = Math.min(perRow, n - row * perRow)
		const col = i % perRow
		const center: Point = {
			x: ((col + 1) / (colsInRow + 1)) * VIRTUAL_W,
			y: PAD_Y + row * ROW_H + ROW_H / 2,
		}
		centers.set(node.nodeId, center)
		return { nodeId: node.nodeId, center }
	})

	const nodeOf = new Map<string, string>()
	for (const node of graph.nodes)
		for (const id of node.identities) nodeOf.set(id.domiaKey, node.nodeId)

	const agg = new Map<
		string,
		{ from: string; to: string; caps: Set<string>; count: number }
	>()
	for (const e of graph.edges) {
		const from = nodeOf.get(e.from)
		const to = nodeOf.get(e.to)
		if (!from || !to || from === to) continue
		const key = `${from}->${to}`
		const g = agg.get(key) ?? { from, to, caps: new Set<string>(), count: 0 }
		g.caps.add(e.capability)
		g.count += e.count
		agg.set(key, g)
	}

	const edges: LayoutEdge[] = [...agg.values()].map((g) => {
		const a = centers.get(g.from)!
		const b = centers.get(g.to)!
		const { path, mid } = quadratic(a, b, g.from < g.to ? 1 : -1)
		return {
			id: `${g.from}->${g.to}`,
			from: g.from,
			to: g.to,
			caps: [...g.caps],
			count: g.count,
			path,
			mid,
		}
	})

	return {
		width: VIRTUAL_W,
		height: PAD_Y * 2 + rows * ROW_H,
		nodes: layoutNodes,
		edges,
	}
}
