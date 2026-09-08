import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, Loader2, XCircle, Plug } from "lucide-react"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Badge } from "@/components/ui/badge"
import { skillsStatusQueryOptions } from "@/server/skills"
import type { SkillProviderStatus } from "@/types/skills"

const dataPlaneLabel = (status: SkillProviderStatus): string | null => {
	const spec = status.specialization
	if (!spec || typeof spec.dataPlane !== "string") return null
	const live = spec.live === true
	const entities = typeof spec.entities === "number" ? spec.entities : 0
	return live
		? m.skills_health_data_plane_live({ entities: String(entities) })
		: m.skills_health_data_plane_down({ mode: spec.dataPlane })
}

function ProviderRow({ status }: { status: SkillProviderStatus }) {
	const plane = dataPlaneLabel(status)
	return (
		<div className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2">
			<div className="min-w-0 space-y-0.5">
				<div className="flex items-center gap-2">
					<span className="truncate text-sm font-medium">{status.name}</span>
					{status.kind && (
						<Badge variant="outline" className="text-[10px]">
							{status.kind}
						</Badge>
					)}
				</div>
				<p className="text-muted-foreground text-xs">
					{m.skills_health_tools({
						allowed: String(status.allowedTools),
						cached: String(status.cachedTools),
					})}
					{status.lastSyncAt
						? ` · ${m.skills_health_synced({ at: new Date(status.lastSyncAt).toLocaleTimeString() })}`
						: ""}
					{plane ? ` · ${plane}` : ""}
				</p>
			</div>
			{status.connected ? (
				<Badge className="gap-1 bg-emerald-600 text-white hover:bg-emerald-600">
					<CheckCircle2 className="size-3.5" />
					{m.skills_health_connected()}
				</Badge>
			) : (
				<Badge variant="destructive" className="gap-1">
					<XCircle className="size-3.5" />
					{m.skills_health_disconnected()}
				</Badge>
			)}
		</div>
	)
}

export function SkillsHealthPanel({
	domiaKey,
	online,
	enabled,
}: {
	domiaKey: string
	online: boolean
	enabled: boolean
}) {
	const query = useQuery({
		...skillsStatusQueryOptions(domiaKey),
		enabled: enabled && online,
		refetchInterval: 15000,
	})

	if (!online)
		return <p className="text-muted-foreground text-sm">{m.health_offline()}</p>
	if (query.isLoading)
		return (
			<div className="text-muted-foreground flex items-center gap-2 text-sm">
				<Loader2 className="size-4 animate-spin" />
				{m.health_checking()}
			</div>
		)
	if (query.isError)
		return <p className="text-destructive text-sm">{m.health_load_failed()}</p>
	const result = query.data
	if (!result?.ok || !result.data)
		return (
			<p className="text-destructive text-sm">
				{result && !result.ok ? errText(result.error) : m.health_none()}
			</p>
		)
	const status = result.data
	if (!status.skillsEngine)
		return (
			<p className="text-muted-foreground flex items-center gap-2 text-sm">
				<Plug className="size-4 opacity-60" />
				{m.skills_health_engine_off()}
			</p>
		)
	if (status.providers.length === 0)
		return (
			<p className="text-muted-foreground text-sm">{m.skills_health_none()}</p>
		)
	return (
		<div className="space-y-2">
			{status.providers.map((provider) => (
				<ProviderRow key={provider.id} status={provider} />
			))}
		</div>
	)
}
