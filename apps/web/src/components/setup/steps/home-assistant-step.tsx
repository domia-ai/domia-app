import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Check, Loader2, Radar } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"
import { errText } from "@/utils/service-errors"
import { summarizeApply } from "@/lib/config-apply"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldLabel } from "@/components/ui/field"
import { SkillsHealthPanel } from "@/components/domia/skills-health-panel"
import { discoverSkillProvidersFn } from "@/server/skills"
import { pairHomeAssistantFn } from "@/server/setup"
import { isDemoMode } from "@/lib/demo"
import { SKILL_PRESETS } from "@/constants/skill-presets"
import { HOME_ASSISTANT_PROVIDER_NAME } from "@/constants/setup"
import { StepShell, ContinueButton } from "./step-shell"
import type { DiscoveredSkillProvider } from "@/types/skills"
import type { SetupStepProps } from "@/types/setup-ui"

const HA_PRESET_URL =
	SKILL_PRESETS.find((p) => p.id === HOME_ASSISTANT_PROVIDER_NAME)?.draft.url ??
	""

export function HomeAssistantStep({
	domiaKey,
	online,
	onNext,
}: SetupStepProps) {
	const queryClient = useQueryClient()
	const [url, setUrl] = useState("")
	const [token, setToken] = useState("")
	const [paired, setPaired] = useState(false)

	const discover = useMutation({
		mutationFn: () => discoverSkillProvidersFn({ data: domiaKey }),
	})
	const pair = useMutation({
		mutationFn: () =>
			pairHomeAssistantFn({
				data: { domiaKey, url: url.trim(), token: token.trim() },
			}),
	})

	const found: DiscoveredSkillProvider[] = discover.data?.ok
		? (discover.data.data ?? [])
		: []
	const discoverError = discover.isError
		? m.config_skill_discover_failed()
		: discover.data && !discover.data.ok
			? errText(discover.data.error)
			: null

	const onPair = async () => {
		const result = await pair.mutateAsync()
		if (result.ok && result.data) {
			setPaired(true)
			setToken("")
			toast.success(m.setup_ha_paired(), {
				description: result.data.apply
					? summarizeApply(result.data.apply)
					: undefined,
			})
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["config", domiaKey] }),
				queryClient.invalidateQueries({
					queryKey: ["skills-status", domiaKey],
				}),
				queryClient.invalidateQueries({ queryKey: ["fleet"] }),
			])
		} else {
			toast.error(m.setup_ha_pair_failed(), {
				description: errText(result.ok ? undefined : result.error),
			})
		}
	}

	const canPair = url.trim() !== "" && token.trim() !== "" && online

	return (
		<StepShell
			title={m.setup_ha_title()}
			description={m.setup_ha_desc()}
			onSkip={onNext}
			primary={
				paired ? (
					<ContinueButton onClick={onNext} />
				) : (
					<Button
						type="button"
						disabled={!canPair || pair.isPending || isDemoMode()}
						onClick={onPair}
					>
						{pair.isPending && <Loader2 className="size-4 animate-spin" />}
						{m.setup_ha_pair()}
					</Button>
				)
			}
		>
			<div className="space-y-4">
				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						size="sm"
						disabled={!online || discover.isPending}
						onClick={() => discover.mutate()}
					>
						{discover.isPending ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Radar className="size-4" />
						)}
						{m.config_skill_discover()}
					</Button>
					{discoverError && (
						<span className="text-destructive text-xs">{discoverError}</span>
					)}
					{discover.data?.ok && found.length === 0 && (
						<span className="text-muted-foreground text-xs">
							{m.config_skill_discover_none()}
						</span>
					)}
				</div>

				{found.length > 0 && (
					<div className="space-y-2">
						{found.map((f) => {
							const active = url === f.url
							return (
								<button
									key={f.url}
									type="button"
									onClick={() => setUrl(f.url)}
									className={cn(
										"flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors",
										active
											? "border-primary bg-primary/5"
											: "hover:bg-muted/50",
									)}
								>
									<div className="min-w-0 flex-1">
										<p className="truncate text-sm font-medium">
											{f.name}
											{f.version ? ` · ${f.version}` : ""}
										</p>
										<p className="text-muted-foreground truncate font-mono text-xs">
											{f.url}
										</p>
									</div>
									{active && <Check className="text-primary size-4 shrink-0" />}
								</button>
							)
						})}
					</div>
				)}

				<div className="grid gap-3 sm:grid-cols-2">
					<Field>
						<FieldLabel htmlFor="setup-ha-url">
							{m.config_skill_endpoint_url()}
						</FieldLabel>
						<Input
							id="setup-ha-url"
							value={url}
							onChange={(e) => setUrl(e.target.value)}
							placeholder={HA_PRESET_URL}
						/>
					</Field>
					<Field>
						<FieldLabel htmlFor="setup-ha-token">
							{m.config_skill_token()}
						</FieldLabel>
						<Input
							id="setup-ha-token"
							type="password"
							autoComplete="off"
							value={token}
							onChange={(e) => setToken(e.target.value)}
							placeholder={m.setup_ha_token_placeholder()}
						/>
					</Field>
				</div>
				<p className="text-muted-foreground text-xs">
					{m.setup_ha_token_hint()}
				</p>

				{paired && (
					<div className="space-y-2 border-t pt-4">
						<p className="text-sm font-medium">{m.setup_ha_status_title()}</p>
						<SkillsHealthPanel domiaKey={domiaKey} online={online} enabled />
					</div>
				)}
			</div>
		</StepShell>
	)
}
