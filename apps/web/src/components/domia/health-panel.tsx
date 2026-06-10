import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, HelpCircle, Loader2, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { configHealthQueryOptions } from "@/server/config"
import type { ConfigHealthEntry } from "@/types/config"

const STATUS = {
	ok: {
		icon: CheckCircle2,
		className: "text-emerald-600 dark:text-emerald-400",
	},
	missing: { icon: XCircle, className: "text-destructive" },
	unknown: { icon: HelpCircle, className: "text-muted-foreground" },
} as const

function HealthRow({ entry }: { entry: ConfigHealthEntry }) {
	const { icon: Icon, className } = STATUS[entry.status]
	return (
		<div className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5">
			<div className="min-w-0 space-y-0.5">
				<div className="flex items-center gap-2">
					<span className="text-sm font-medium capitalize">{entry.stage}</span>
					{entry.engine && (
						<Badge variant="secondary" className="text-[10px]">
							{entry.engine}
						</Badge>
					)}
				</div>
				{entry.configured && (
					<p className="text-muted-foreground truncate text-xs">
						{entry.configured}
					</p>
				)}
				{entry.path && (
					<p className="text-muted-foreground/70 truncate font-mono text-[11px]">
						{entry.path}
					</p>
				)}
				{entry.detail && (
					<p className="text-muted-foreground text-xs">{entry.detail}</p>
				)}
			</div>
			<Icon className={`mt-0.5 size-4 shrink-0 ${className}`} />
		</div>
	)
}

export function HealthPanel({
	domiaKey,
	online,
	enabled,
}: {
	domiaKey: string
	online: boolean
	enabled: boolean
}) {
	const query = useQuery({
		...configHealthQueryOptions(domiaKey),
		enabled: enabled && online,
	})

	if (!online)
		return (
			<p className="text-muted-foreground py-8 text-center text-sm">
				Offline — diagnostics unavailable.
			</p>
		)
	if (query.isLoading)
		return (
			<div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
				<Loader2 className="size-4 animate-spin" />
				Checking installed models…
			</div>
		)
	if (query.isError)
		return (
			<p className="text-destructive py-8 text-center text-sm">
				Could not load diagnostics.
			</p>
		)
	const result = query.data
	if (!result?.ok || !result.data)
		return (
			<p className="text-destructive py-8 text-center text-sm">
				{result && !result.ok ? result.error : "No diagnostics"}
			</p>
		)

	const health = result.data
	return (
		<div className="space-y-3">
			<div className="flex items-center gap-2">
				{health.ok ? (
					<Badge className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-600">
						<CheckCircle2 className="size-3.5" />
						All configured models installed
					</Badge>
				) : (
					<Badge variant="destructive" className="gap-1.5">
						<XCircle className="size-3.5" />
						Missing models
					</Badge>
				)}
			</div>
			<div className="space-y-2">
				{health.entries.map((entry) => (
					<HealthRow key={entry.stage} entry={entry} />
				))}
			</div>
		</div>
	)
}
