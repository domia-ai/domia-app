import { useQuery } from "@tanstack/react-query"
import { CheckCircle2, EyeOff, Loader2, XCircle, Plug } from "lucide-react"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"
import { errText } from "@/utils/service-errors"
import { Badge } from "@/components/ui/badge"
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip"
import { skillsStatusQueryOptions } from "@/server/skills"
import {
	SKILL_DESCRIPTOR_ICON,
	SKILL_POLICY_BADGE_META,
	SKILL_RISK_CLASS_META,
	SKILL_TRUST_TIER_META,
} from "@/constants/skills"
import type {
	SkillProviderStatus,
	SkillToolView,
	SkillTrustTierMeta,
} from "@/types/skills"

const CHIP =
	"inline-flex shrink-0 items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] leading-none font-medium"

const BUILTIN_PROVIDER_KIND = "domia"

const TRUST_TIER_META: Record<string, SkillTrustTierMeta | undefined> =
	SKILL_TRUST_TIER_META

const dataPlaneLabel = (status: SkillProviderStatus): string | null => {
	const spec = status.specialization
	if (!spec || typeof spec.dataPlane !== "string") return null
	const live = spec.live === true
	const entities = typeof spec.entities === "number" ? spec.entities : 0
	return live
		? m.skills_health_data_plane_live({ entities: String(entities) })
		: m.skills_health_data_plane_down({ mode: spec.dataPlane })
}

const playersLabel = (status: SkillProviderStatus): string | null => {
	const spec = status.specialization
	if (!spec || typeof spec.players !== "number") return null
	const track =
		typeof spec.nowPlaying === "string" && spec.nowPlaying.trim()
			? spec.nowPlaying.trim()
			: m.skills_health_now_playing_none()
	return m.skills_health_players({
		players: String(spec.players),
		nowPlaying: track,
	})
}

function TrustTierChip({ tier }: { tier: string }) {
	const meta = TRUST_TIER_META[tier]
	if (!meta)
		return (
			<span
				className={cn(CHIP, "border-border bg-muted text-muted-foreground")}
			>
				{tier}
			</span>
		)
	const Icon = meta.icon
	return (
		<Tooltip>
			<TooltipTrigger render={<span className={cn(CHIP, meta.className)} />}>
				<Icon className="size-3" />
				{meta.label()}
			</TooltipTrigger>
			<TooltipContent className="max-w-72">
				{meta.help()} {m.skills_health_trust_descriptor_note()}
			</TooltipContent>
		</Tooltip>
	)
}

function ToolRow({ tool }: { tool: SkillToolView }) {
	const risk = tool.riskClass ? SKILL_RISK_CLASS_META[tool.riskClass] : null
	const RiskIcon = risk?.icon
	const policy =
		tool.policy && tool.policy !== "allow"
			? SKILL_POLICY_BADGE_META[tool.policy]
			: null
	const PolicyIcon = policy?.icon
	const DescriptorIcon = SKILL_DESCRIPTOR_ICON
	return (
		<li className="flex items-center justify-between gap-2">
			<span
				className={cn(
					"truncate font-mono text-[11px]",
					tool.hidden && "text-muted-foreground",
				)}
			>
				{tool.displayName}
			</span>
			<span className="flex shrink-0 items-center gap-1">
				{tool.hidden && (
					<Tooltip>
						<TooltipTrigger
							render={
								<span
									className={cn(
										CHIP,
										"border-border bg-muted text-muted-foreground",
									)}
								/>
							}
						>
							<EyeOff className="size-3" />
							{m.skills_tool_hidden()}
						</TooltipTrigger>
						<TooltipContent className="max-w-72">
							{m.skills_tool_hidden_help()}
						</TooltipContent>
					</Tooltip>
				)}
				{risk && RiskIcon && (
					<span className={cn(CHIP, risk.className)}>
						<RiskIcon className="size-3" />
						{risk.label()}
					</span>
				)}
				{policy && PolicyIcon && (
					<span className={cn(CHIP, policy.className)}>
						<PolicyIcon className="size-3" />
						{policy.label()}
					</span>
				)}
				{tool.fromDescriptor && (
					<Tooltip>
						<TooltipTrigger
							render={
								<span
									className={cn(
										CHIP,
										"border-border bg-muted text-muted-foreground",
									)}
								/>
							}
						>
							<DescriptorIcon className="size-3" />
							{m.skills_health_from_descriptor()}
						</TooltipTrigger>
						<TooltipContent className="max-w-72">
							{m.skills_health_from_descriptor_help()}
						</TooltipContent>
					</Tooltip>
				)}
			</span>
		</li>
	)
}

function ProviderRow({
	status,
	disabled,
	note,
}: {
	status: SkillProviderStatus
	disabled: boolean
	note: string | null
}) {
	const plane = dataPlaneLabel(status)
	const players = playersLabel(status)
	return (
		<div className="space-y-2 rounded-lg border px-3 py-2">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 space-y-0.5">
					<div className="flex flex-wrap items-center gap-2">
						<span className="truncate text-sm font-medium">{status.name}</span>
						{status.kind && (
							<Badge variant="outline" className="text-[10px]">
								{status.kind}
							</Badge>
						)}
						{status.trustTier && <TrustTierChip tier={status.trustTier} />}
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
						{players ? ` · ${players}` : ""}
						{status.confirmTools > 0
							? ` · ${m.skills_health_confirm_count({ count: String(status.confirmTools) })}`
							: ""}
						{status.blockedTools > 0
							? ` · ${m.skills_health_blocked_count({ count: String(status.blockedTools) })}`
							: ""}
						{status.hiddenTools
							? ` · ${m.skills_hidden_count({ count: String(status.hiddenTools) })}`
							: ""}
					</p>
					{note && (
						<p className="text-muted-foreground flex items-center gap-1.5 text-xs">
							<Plug className="size-3.5 opacity-60" />
							{note}
						</p>
					)}
				</div>
				{disabled ? (
					<Badge variant="outline" className="text-muted-foreground gap-1">
						<Plug className="size-3.5" />
						{status.connected
							? m.skills_health_connected()
							: m.skills_health_disconnected()}
					</Badge>
				) : status.connected ? (
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
			{status.tools.length > 0 && (
				<ul className="space-y-1 border-t pt-2">
					{status.tools.map((tool) => (
						<ToolRow key={tool.rawName} tool={tool} />
					))}
				</ul>
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
	if (!status.skillsEngine && !status.builtinTools)
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
	const isBuiltin = (provider: SkillProviderStatus): boolean =>
		provider.kind === BUILTIN_PROVIDER_KIND
	const showEngineOff =
		!status.skillsEngine && status.providers.some((p) => !isBuiltin(p))
	return (
		<div className="space-y-2">
			{showEngineOff && (
				<p className="text-muted-foreground flex items-center gap-2 text-sm">
					<Plug className="size-4 opacity-60" />
					{m.skills_engine_off_mcp()}
				</p>
			)}
			{status.providers.map((provider) => {
				const builtin = isBuiltin(provider)
				const disabled = builtin ? !status.builtinTools : !status.skillsEngine
				return (
					<ProviderRow
						key={provider.id}
						status={provider}
						disabled={disabled}
						note={builtin && disabled ? m.skills_builtin_off() : null}
					/>
				)
			})}
		</div>
	)
}
