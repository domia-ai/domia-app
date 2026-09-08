import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Check, Loader2 } from "lucide-react"
import { m } from "@/paraglide/messages"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { setupTargetsQueryOptions } from "@/server/setup"
import { SETUP_STEPS } from "@/constants/setup"
import { NameStep } from "./steps/name-step"
import { TemplateStep } from "./steps/template-step"
import { HomeAssistantStep } from "./steps/home-assistant-step"
import { SatelliteStep } from "./steps/satellite-step"
import { VerifyStep } from "./steps/verify-step"
import type { SetupStepId, SetupTarget } from "@/types/setup"

const STEP_LABELS: Record<SetupStepId, () => string> = {
	name: m.setup_step_name,
	template: m.setup_step_template,
	"home-assistant": m.setup_step_home_assistant,
	satellite: m.setup_step_satellite,
	verify: m.setup_step_verify,
}

function StepRail({
	current,
	onSelect,
}: {
	current: SetupStepId
	onSelect: (step: SetupStepId) => void
}) {
	const index = SETUP_STEPS.indexOf(current)
	return (
		<ol className="flex flex-wrap items-center gap-2">
			{SETUP_STEPS.map((step, i) => {
				const done = i < index
				const active = i === index
				return (
					<li key={step} className="flex items-center gap-2">
						<button
							type="button"
							onClick={() => onSelect(step)}
							className={cn(
								"flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
								active
									? "border-primary bg-primary/10 font-medium"
									: done
										? "border-emerald-500/40 text-emerald-700 dark:text-emerald-400"
										: "text-muted-foreground hover:text-foreground",
							)}
						>
							<span
								className={cn(
									"flex size-4 items-center justify-center rounded-full text-[10px] tabular-nums",
									active
										? "bg-primary text-primary-foreground"
										: done
											? "bg-emerald-500 text-white"
											: "bg-muted",
								)}
							>
								{done ? <Check className="size-3" /> : i + 1}
							</span>
							{STEP_LABELS[step]()}
						</button>
						{i < SETUP_STEPS.length - 1 && (
							<span className="bg-border h-px w-4" aria-hidden />
						)}
					</li>
				)
			})}
		</ol>
	)
}

function PickTarget({ targets }: { targets: SetupTarget[] }) {
	const navigate = useNavigate()
	if (targets.length === 0)
		return (
			<p className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
				{m.setup_pick_empty()}
			</p>
		)
	return (
		<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
			{targets.map((t) => (
				<button
					key={t.domiaKey}
					type="button"
					disabled={!t.online}
					onClick={() =>
						void navigate({
							to: "/setup",
							search: { domia: t.domiaKey, step: "name" },
						})
					}
					className="hover:border-primary hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors disabled:opacity-50"
				>
					<div className="min-w-0 flex-1">
						<div className="flex items-center gap-2">
							<p className="truncate text-sm font-medium">{t.name}</p>
							{t.fresh && (
								<Badge variant="outline" className="text-[10px]">
									{m.setup_fresh_badge()}
								</Badge>
							)}
						</div>
						<p className="text-muted-foreground font-mono text-xs">
							{t.domiaKey}
							{!t.online ? m.tpl_new_offline_suffix() : ""}
						</p>
					</div>
				</button>
			))}
		</div>
	)
}

export function SetupWizard({
	domiaKey,
	step,
}: {
	domiaKey?: string
	step: SetupStepId
}) {
	const navigate = useNavigate()
	const targets = useQuery(setupTargetsQueryOptions())

	const go = (next: SetupStepId) =>
		void navigate({ to: "/setup", search: { domia: domiaKey, step: next } })
	const advance = () => {
		const i = SETUP_STEPS.indexOf(step)
		const next = SETUP_STEPS[Math.min(i + 1, SETUP_STEPS.length - 1)]
		go(next)
	}
	const finish = () =>
		void navigate({ to: "/domias/$key", params: { key: domiaKey ?? "" } })

	if (targets.isLoading)
		return (
			<div className="text-muted-foreground flex items-center gap-2 py-16 text-sm">
				<Loader2 className="size-4 animate-spin" />
				{m.cmd_loading()}
			</div>
		)
	if (targets.isError)
		return (
			<p className="text-destructive py-16 text-center text-sm">
				{m.setup_targets_failed()}
			</p>
		)

	const target = (targets.data ?? []).find((t) => t.domiaKey === domiaKey)
	if (!domiaKey || !target)
		return (
			<div className="space-y-4">
				<p className="text-muted-foreground text-sm">{m.setup_pick_desc()}</p>
				<PickTarget targets={targets.data ?? []} />
			</div>
		)

	const common = {
		domiaKey,
		domiaName: target.name,
		online: target.online,
		onNext: advance,
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center gap-3">
				<StepRail current={step} onSelect={go} />
				<Badge variant="secondary" className="ml-auto font-mono text-xs">
					{domiaKey}
				</Badge>
			</div>
			{!target.online && (
				<p className="text-destructive rounded-lg border border-dashed px-4 py-2.5 text-sm">
					{m.setup_target_offline()}
				</p>
			)}
			{step === "name" && <NameStep {...common} />}
			{step === "template" && <TemplateStep {...common} />}
			{step === "home-assistant" && <HomeAssistantStep {...common} />}
			{step === "satellite" && <SatelliteStep {...common} />}
			{step === "verify" && <VerifyStep {...common} onFinish={finish} />}
		</div>
	)
}
