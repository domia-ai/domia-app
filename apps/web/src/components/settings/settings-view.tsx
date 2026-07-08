import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTheme } from "next-themes"
import { Languages } from "lucide-react"
import { m } from "@/paraglide/messages"
import { getLocale, setLocale, locales } from "@/paraglide/runtime"
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
	{ id: "light", label: m.settings_theme_light, icon: Sun },
	{ id: "dark", label: m.settings_theme_dark, icon: Moon },
	{ id: "system", label: m.settings_theme_system, icon: Monitor },
]

const REFRESH_OPTIONS = [
	{ ms: 3000, label: "3s" },
	{ ms: 5000, label: "5s" },
	{ ms: 10000, label: "10s" },
	{ ms: 30000, label: "30s" },
]

const COUNT_LABELS: { key: string; label: () => string }[] = [
	{ key: "domias", label: m.settings_count_domias },
	{ key: "interactions", label: m.settings_count_conversations },
	{ key: "sessions", label: m.settings_count_sessions },
	{ key: "memoryFacts", label: m.settings_count_memory_facts },
	{ key: "emotionEvents", label: m.settings_count_emotion_events },
	{ key: "audioAssets", label: m.settings_count_audio_assets },
	{ key: "templates", label: m.settings_count_templates },
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
					<CardTitle>{m.settings_appearance()}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-muted-foreground text-sm">
						{m.settings_appearance_help()}
					</p>
					{mounted ? (
						<OptionGroup
							value={theme ?? "dark"}
							options={THEMES.map((t) => ({
								id: t.id,
								label: t.label(),
								icon: t.icon,
							}))}
							onChange={setTheme}
						/>
					) : (
						<Skeleton className="h-9 w-64" />
					)}
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{m.settings_language()}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-muted-foreground text-sm">
						{m.settings_language_help()}
					</p>
					<div className="flex gap-2">
						{locales.map((locale) => (
							<Button
								key={locale}
								variant={getLocale() === locale ? "default" : "outline"}
								size="sm"
								onClick={() => setLocale(locale)}
							>
								<Languages className="mr-1 size-4" />
								{locale === "en" ? m.lang_en() : m.lang_es()}
							</Button>
						))}
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>{m.settings_live_refresh()}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-muted-foreground text-sm">
						{m.settings_live_refresh_help()}
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
					<CardTitle>{m.settings_collector_sync()}</CardTitle>
				</CardHeader>
				<CardContent>
					{overviewQuery.isLoading && <Skeleton className="h-24 w-full" />}
					{overviewQuery.isError && (
						<p className="text-destructive text-sm">
							{m.settings_sync_load_error()}
						</p>
					)}
					{overview && overview.sync.length === 0 && (
						<p className="text-muted-foreground text-sm">
							{m.settings_no_domias()}
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
												? m.settings_synced({
														time: relativeTimeMs(s.lastSyncedAt),
													})
												: m.settings_never_synced()}
											{s.cursorAt &&
												` · ${m.settings_cursor_at({ time: relativeTime(s.cursorAt) })}`}
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
					<CardTitle>{m.settings_data_about()}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					{overviewQuery.isLoading && <Skeleton className="h-24 w-full" />}
					{overviewQuery.isError && (
						<p className="text-destructive text-sm">
							{m.settings_data_load_error()}
						</p>
					)}
					{overview && (
						<>
							<div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
								{COUNT_LABELS.map(({ key, label }) => (
									<div key={key} className="rounded-lg border p-3">
										<p className="text-muted-foreground text-xs">{label()}</p>
										<p className="text-lg font-semibold tabular-nums">
											{overview.counts[key as keyof typeof overview.counts]}
										</p>
									</div>
								))}
								<div className="rounded-lg border p-3">
									<p className="text-muted-foreground text-xs">
										{m.settings_database_size()}
									</p>
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
									{m.settings_export_conversations()}
								</Button>
								<Badge variant="secondary">
									{m.settings_console_version({ version: overview.version })}
								</Badge>
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
