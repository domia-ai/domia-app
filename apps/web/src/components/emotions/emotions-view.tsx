import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { DataTablePagination } from "@/components/data-table/pagination"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { MoodRadar } from "@/components/domia/mood-radar"
import { getEmotionsOverviewFn } from "@/server/emotions"
import { accentFor } from "@/utils/accent"
import {
	EMOTION_KEYS,
	EMOTION_META,
	type EmotionKey,
} from "@/constants/emotions"
import { cn } from "@/lib/utils"
import { EmotionTrend } from "./emotion-trend"
import { DeltaChips } from "./delta-chips"
import { relativeTime } from "@/utils/format"
import type { EmotionState } from "@/types"

const DEFAULT_VISIBLE: EmotionKey[] = ["joy", "trust", "anticipation"]
const EVENTS_PAGE_SIZE = 8

export function EmotionsView() {
	const overviewQuery = useQuery({
		queryKey: ["emotions-overview"],
		queryFn: () => getEmotionsOverviewFn(),
	})

	const domias = overviewQuery.data?.domias ?? []

	const [activeKey, setActiveKey] = useState<string | null>(null)
	const [page, setPage] = useState(0)
	const [pageSize, setPageSize] = useState(EVENTS_PAGE_SIZE)
	const [visible, setVisible] = useState<Set<EmotionKey>>(
		() => new Set(DEFAULT_VISIBLE),
	)

	const selectDomia = (key: string) => {
		setActiveKey(key)
		setPage(0)
	}

	const active =
		domias.find((m) => m.domiaKey === activeKey) ?? domias[0] ?? null
	const activeEvents = active?.events ?? []
	const series = active?.series ?? []

	const toggle = (k: EmotionKey) =>
		setVisible((prev) => {
			const next = new Set(prev)
			if (next.has(k)) next.delete(k)
			else next.add(k)
			return next
		})

	if (overviewQuery.isLoading) return <Skeleton className="h-[420px] w-full" />
	if (overviewQuery.isError)
		return <p className="text-destructive text-sm">Couldn't load emotions.</p>
	if (!active)
		return (
			<div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
				No Domias discovered yet.
			</div>
		)

	const accent = accentFor(active.domiaKey)

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap gap-3">
				{domias.map((m) => {
					const dom = m.dominant
					const isActive = m.domiaKey === active.domiaKey
					return (
						<button
							key={m.domiaKey}
							type="button"
							onClick={() => selectDomia(m.domiaKey)}
							className={cn(
								"flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors",
								isActive
									? "border-primary bg-primary/5"
									: "border-border hover:bg-muted/40",
							)}
						>
							<PersonaAvatar
								domiaKey={m.domiaKey}
								name={m.name}
								avatarId={m.avatarId}
								size="sm"
							/>
							<div className="space-y-0.5">
								<p className="text-sm font-medium">{m.name}</p>
								{dom ? (
									<span
										className="text-[10px] font-medium tracking-wide uppercase"
										style={{ color: EMOTION_META[dom].color }}
									>
										{EMOTION_META[dom].label}
									</span>
								) : (
									<span className="text-muted-foreground text-[10px] tracking-wide uppercase">
										neutral
									</span>
								)}
							</div>
						</button>
					)
				})}
			</div>

			<div className="grid gap-6 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardHeader className="gap-3">
						<CardTitle>Emotion trend · {active.name}</CardTitle>
						<div className="flex flex-wrap gap-1.5">
							{EMOTION_KEYS.map((k) => {
								const on = visible.has(k)
								return (
									<button
										key={k}
										type="button"
										onClick={() => toggle(k)}
										className={cn(
											"flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
											on
												? "border-border bg-muted text-foreground"
												: "border-border text-muted-foreground/50",
										)}
									>
										<span
											className="size-2.5 rounded-full"
											style={{
												backgroundColor: on
													? EMOTION_META[k].color
													: "var(--muted-foreground)",
											}}
										/>
										{EMOTION_META[k].label}
									</button>
								)
							})}
						</div>
					</CardHeader>
					<CardContent>
						<EmotionTrend series={series} visible={visible} accent={accent} />
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Current mood</CardTitle>
					</CardHeader>
					<CardContent>
						{active.emotion ? (
							<MoodRadar
								emotion={active.emotion as EmotionState}
								accent={accent}
							/>
						) : (
							<p className="text-muted-foreground py-8 text-center text-sm">
								No mood snapshot.
							</p>
						)}
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Emotion events · {active.name}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="divide-border divide-y">
						{activeEvents.length === 0 && (
							<p className="text-muted-foreground py-3 text-sm">
								No events yet.
							</p>
						)}
						{activeEvents
							.slice()
							.reverse()
							.slice(page * pageSize, page * pageSize + pageSize)
							.map((e) => (
								<div key={e.id} className="flex items-center gap-4 py-3">
									<div className="min-w-0 flex-1">
										<p className="text-sm font-medium">{e.cause ?? "—"}</p>
										<p className="text-muted-foreground text-xs">
											{relativeTime(e.createdAt)}
										</p>
									</div>
									<DeltaChips delta={e.delta} />
								</div>
							))}
					</div>
					{activeEvents.length > pageSize && (
						<DataTablePagination
							page={page}
							pageSize={pageSize}
							total={activeEvents.length}
							onPageChange={setPage}
							onPageSizeChange={(s) => {
								setPageSize(s)
								setPage(0)
							}}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
