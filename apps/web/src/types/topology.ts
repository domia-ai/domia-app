export type Point = { x: number; y: number }

export type LayoutNode = {
	nodeId: string
	center: Point
}

export type LayoutEdge = {
	id: string
	from: string
	to: string
	caps: string[]
	count: number
	path: string
	mid: Point
}

export type GraphLayout = {
	width: number
	height: number
	nodes: LayoutNode[]
	edges: LayoutEdge[]
}
