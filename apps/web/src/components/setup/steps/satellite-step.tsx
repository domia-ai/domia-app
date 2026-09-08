import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, RadioTower } from "lucide-react"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Badge } from "@/components/ui/badge"
import { StatusDot } from "@/components/domia/status"
import { AddSatelliteDialog } from "@/components/satellites/add-satellite-dialog"
import { satellitesQueryOptions } from "@/server/satellites"
import { StepShell, ContinueButton } from "./step-shell"
import type { SetupStepProps } from "@/types/setup-ui"

export function SatelliteStep({
	domiaKey,
	domiaName,
	online,
	onNext,
}: SetupStepProps) {
	const queryClient = useQueryClient()
	const query = useQuery({
		...satellitesQueryOptions(domiaKey),
		enabled: online,
	})
	const satellites = query.data?.ok ? (query.data.data ?? []) : []

	return (
		<StepShell
			title={m.setup_satellite_title()}
			description={m.setup_satellite_desc()}
			onSkip={onNext}
			primary={<ContinueButton onClick={onNext} />}
		>
			<div className="space-y-4">
				<AddSatelliteDialog
					hosted={[{ domiaKey, name: domiaName }]}
					onCreated={() =>
						queryClient.invalidateQueries({
							queryKey: ["satellites", domiaKey],
						})
					}
				/>
				{!online ? (
					<p className="text-muted-foreground text-sm">{m.health_offline()}</p>
				) : query.isLoading ? (
					<div className="text-muted-foreground flex items-center gap-2 text-sm">
						<Loader2 className="size-4 animate-spin" />
						{m.cmd_loading()}
					</div>
				) : query.isError ? (
					<p className="text-destructive text-sm">{m.err_list_satellites()}</p>
				) : query.data && !query.data.ok ? (
					<p className="text-destructive text-sm">
						{errText(query.data.error)}
					</p>
				) : satellites.length === 0 ? (
					<p className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-sm">
						<RadioTower className="mx-auto mb-2 size-5 opacity-60" />
						{m.setup_satellite_none()}
					</p>
				) : (
					<div className="space-y-2">
						{satellites.map((s) => (
							<div
								key={s.id}
								className="flex items-center gap-3 rounded-lg border px-3 py-2"
							>
								<StatusDot online={s.online} />
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{s.name ?? s.satelliteId}
									</p>
									<p className="text-muted-foreground font-mono text-xs">
										{s.host}:{s.port}
									</p>
								</div>
								<Badge variant="outline" className="text-[10px]">
									{s.protocol}
								</Badge>
							</div>
						))}
					</div>
				)}
			</div>
		</StepShell>
	)
}
