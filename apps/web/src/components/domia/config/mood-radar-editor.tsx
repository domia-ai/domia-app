import { useRef, useState } from "react"
import { Slider } from "@/components/ui/slider"
import type { ConfigField, FieldValue } from "@/types/config"

const SIZE = 260
const CENTER = SIZE / 2
const RADIUS = 96
const RINGS = [0.25, 0.5, 0.75, 1]

const clamp = (v: number): number => Math.max(-1, Math.min(1, v))
const toRadius = (v: number): number => (clamp(v) + 1) / 2
const fromRadius = (dist: number): number =>
	Math.round((Math.max(0, Math.min(1, dist)) * 2 - 1) * 20) / 20

const angleFor = (i: number, n: number): number =>
	-Math.PI / 2 + (i * 2 * Math.PI) / n

const pointAt = (angle: number, r: number): [number, number] => [
	CENTER + Math.cos(angle) * r * RADIUS,
	CENTER + Math.sin(angle) * r * RADIUS,
]

export function MoodRadarEditor({
	fields,
	values,
	accent,
	onChange,
}: {
	fields: ConfigField[]
	values: Record<string, FieldValue>
	accent: string
	onChange: (key: string, value: number) => void
}) {
	const svgRef = useRef<SVGSVGElement>(null)
	const [active, setActive] = useState<number | null>(null)

	const n = fields.length
	const vals = fields.map((f) => clamp(Number(values[f.key] ?? 0)))

	const setFromPointer = (index: number, clientX: number, clientY: number) => {
		const svg = svgRef.current
		if (!svg) return
		const rect = svg.getBoundingClientRect()
		const x = ((clientX - rect.left) / rect.width) * SIZE
		const y = ((clientY - rect.top) / rect.height) * SIZE
		const dist = Math.hypot(x - CENTER, y - CENTER) / RADIUS
		onChange(fields[index].key, fromRadius(dist))
	}

	return (
		<div className="grid gap-6 lg:grid-cols-[320px_1fr] lg:items-center">
			<svg
				ref={svgRef}
				viewBox={`0 0 ${SIZE} ${SIZE}`}
				className="aspect-square w-full max-w-[320px] touch-none select-none"
				onPointerMove={(e) => {
					if (active !== null) setFromPointer(active, e.clientX, e.clientY)
				}}
				onPointerUp={() => setActive(null)}
				onPointerLeave={() => setActive(null)}
			>
				{RINGS.map((r) => (
					<polygon
						key={r}
						points={fields
							.map((_, i) => pointAt(angleFor(i, n), r).join(","))
							.join(" ")}
						className={
							r === 0.5
								? "stroke-muted-foreground/50 fill-none"
								: "stroke-border fill-none"
						}
						strokeWidth={1}
						strokeDasharray={r === 0.5 ? "3 3" : undefined}
					/>
				))}
				{fields.map((f, i) => {
					const [ex, ey] = pointAt(angleFor(i, n), 1)
					const [lx, ly] = pointAt(angleFor(i, n), 1.18)
					return (
						<g key={f.key}>
							<line
								x1={CENTER}
								y1={CENTER}
								x2={ex}
								y2={ey}
								className="stroke-border"
								strokeWidth={1}
							/>
							<text
								x={lx}
								y={ly}
								textAnchor="middle"
								dominantBaseline="middle"
								className="fill-muted-foreground text-[9px]"
							>
								{f.label}
							</text>
						</g>
					)
				})}
				<polygon
					points={fields
						.map((_, i) => pointAt(angleFor(i, n), toRadius(vals[i])).join(","))
						.join(" ")}
					fill={accent}
					fillOpacity={0.2}
					stroke={accent}
					strokeWidth={1.5}
				/>
				{fields.map((f, i) => {
					const [hx, hy] = pointAt(angleFor(i, n), toRadius(vals[i]))
					return (
						<circle
							key={f.key}
							cx={hx}
							cy={hy}
							r={active === i ? 7 : 5}
							fill={accent}
							className="cursor-grab active:cursor-grabbing"
							onPointerDown={(e) => {
								e.currentTarget.setPointerCapture(e.pointerId)
								setActive(i)
							}}
						/>
					)
				})}
			</svg>

			<div className="space-y-2.5">
				{fields.map((f, i) => (
					<div key={f.key} className="flex items-center gap-3">
						<span className="text-muted-foreground w-24 shrink-0 text-xs">
							{f.label}
						</span>
						<Slider
							min={-1}
							max={1}
							step={0.05}
							value={[vals[i]]}
							onValueChange={(v) =>
								onChange(f.key, Array.isArray(v) ? v[0] : v)
							}
							className="flex-1"
						/>
						<span className="w-10 shrink-0 text-right font-mono text-xs tabular-nums">
							{vals[i].toFixed(2)}
						</span>
					</div>
				))}
			</div>
		</div>
	)
}
