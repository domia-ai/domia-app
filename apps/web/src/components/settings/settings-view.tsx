import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { Download, Monitor, Moon, Sun } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { StatusPill } from "@/components/domia/status"
import { useConsolePrefs } from "@/components/providers/console-prefs"
import { getSettingsOverviewFn } from "@/server/settings"
import { relativeTime, relativeTimeMs, formatBytes } from "@/utils/format"
import { cn } from "@/lib/utils"

const THEMES = [
	{ id: "light", label: "Light", icon: Sun },
	{ id: "dark", label: "Dark", icon: Moon },
	{ id: "system", label: "System", icon: Monitor },
]

const REFRESH_OPTIONS = [
	{ ms: 3000, label: "3s" },
	{ ms: 5000, label: "5s" },
	{ ms: 10000, label: "10s" },
	{ ms: 30000, label: "30s" },
]

const COUNT_LABELS: { key: string; label: string }[] = [
	{ key: "domias", label: "Domias" },
	{ key: "interactions", label: "Conversations" },
	{ key: "sessions", label: "Sessions" },
	{ key: "memoryFacts", label: "Memory facts" },
	{ key: "emotionEvents", label: "Emotion events" },
	{ key: "audioAssets", label: "Audio assets" },
	{ key: "templates", label: "Templates" },
]

function OptionGroup({
	value,
	options,
	onChange,
}: {
	value: string
	options: { id: string; label: string; icon?: typeof Sun }[]
	onChange: (id: string) => void
}) {
	return (
		<div className="flex flex-wrap gap-2">
			{options.map((o) => {
				const Icon = o.icon
				return (
					<button
						key={o.id}
						type="button"
						onClick={() => onChange(o.id)}
						className={cn(
							"flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors",
							o.id === value
								? "border-primary bg-primary/5 font-medium"
								: "border-border text-muted-foreground hover:text-foreground hover:bg-muted/40",
						)}
					>
						{Icon && <Icon className="size-4" />}
						{o.label}
					</button>
				)
			})}
		</div>
	)
}

export function SettingsView() {
	const { theme, setTheme } = useTheme()
	const prefs = useConsolePrefs()
	const [mounted, setMounted] = useState(false)
	useEffect(() => setMounted(true), [])

	const overviewQuery = useQuery({
		queryKey: ["settings-overview"],
		queryFn: () => getSettingsOverviewFn(),
	})
	const overview = overviewQuery.data

	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardTitle>Appearance</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-muted-foreground text-sm">
						Theme for the console. System follows your OS preference.
					</p>
					{mounted ? (
						<OptionGroup
							value={theme ?? "dark"}
							options={THEMES}
							onChange={setTheme}
						/>
					) : (
						<Skeleton className="h-9 w-64" />
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Live refresh</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-muted-foreground text-sm">
						How often live views (Overview, Domias, Conversations in live mode)
						poll for fresh data.
					</p>
					{mounted ? (
						<OptionGroup
							value={String(prefs.liveRefreshMs)}
							options={REFRESH_OPTIONS.map((o) => ({
								id: String(o.ms),
								label: o.label,
							}))}
							onChange={(id) => prefs.setLiveRefreshMs(Number(id))}
						/>
					) : (
						<Skeleton className="h-9 w-64" />
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Collector & sync</CardTitle>
				</CardHeader>
				<CardContent>
					{overviewQuery.isLoading && <Skeleton className="h-24 w-full" />}
					{overviewQuery.isError && (
						<p className="text-destructive text-sm">
							Couldn't load sync status.
						</p>
					)}
					{overview && overview.sync.length === 0 && (
						<p className="text-muted-foreground text-sm">
							No Domias discovered yet.
						</p>
					)}
					{overview && overview.sync.length > 0 && (
						<div className="divide-border divide-y">
							{overview.sync.map((s) => (
								<div key={s.domiaKey} className="flex items-center gap-3 py-3">
									<PersonaAvatar
										domiaKey={s.domiaKey}
										name={s.name ?? s.domiaKey}
										avatarId={s.avatarId}
										size="sm"
									/>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<p className="truncate text-sm font-medium">
												{s.name ?? s.domiaKey}
											</p>
											<StatusPill online={s.online} />
										</div>
										<p className="text-muted-foreground text-xs">
											{s.lastSyncedAt
												? `Synced ${relativeTimeMs(s.lastSyncedAt)}`
												: "Never synced"}
											{s.cursorAt && ` · cursor at ${relativeTime(s.cursorAt)}`}
										</p>
									</div>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Data & about</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{overviewQuery.isLoading && <Skeleton className="h-24 w-full" />}
					{overviewQuery.isError && (
						<p className="text-destructive text-sm">Couldn't load data info.</p>
					)}
					{overview && (
						<>
							<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
								{COUNT_LABELS.map(({ key, label }) => (
									<div key={key} className="rounded-lg border p-3">
										<p className="text-muted-foreground text-xs">{label}</p>
										<p className="text-lg font-semibold tabular-nums">
											{overview.counts[key as keyof typeof overview.counts]}
										</p>
									</div>
								))}
								<div className="rounded-lg border p-3">
									<p className="text-muted-foreground text-xs">Database size</p>
									<p className="text-lg font-semibold tabular-nums">
										{formatBytes(overview.dbBytes)}
									</p>
								</div>
							</div>
							<div className="flex flex-wrap items-center gap-3">
								<Button
									variant="outline"
									nativeButton={false}
									render={<a href="/api/conversations/export" />}
								>
									<Download className="size-4" />
									Export conversations (JSONL)
								</Button>
								<Badge variant="secondary">
									Domia Console v{overview.version}
								</Badge>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
