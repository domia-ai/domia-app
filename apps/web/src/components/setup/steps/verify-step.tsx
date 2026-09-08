import { useQuery } from "@tanstack/react-query"
import {
	AlertTriangle,
	CheckCircle2,
	Loader2,
	RefreshCw,
	XCircle,
} from "lucide-react"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Button } from "@/components/ui/button"
import { setupVerificationQueryOptions } from "@/server/setup"
import { StepShell, ContinueButton } from "./step-shell"
import type { SetupCheck, SetupCheckStatus } from "@/types/setup"
import type { SetupStepProps } from "@/types/setup-ui"

const STATUS: Record<
	SetupCheckStatus,
	{ icon: typeof CheckCircle2; className: string }
> = {
	ok: {
		icon: CheckCircle2,
		className: "text-emerald-600 dark:text-emerald-400",
	},
	warn: {
		icon: AlertTriangle,
		className: "text-amber-600 dark:text-amber-400",
	},
	fail: { icon: XCircle, className: "text-destructive" },
}

const CHECK_LABELS: Record<SetupCheck["id"], () => string> = {
	health: m.setup_check_health,
	identity: m.setup_check_identity,
	engines: m.setup_check_engines,
	skills: m.setup_check_skills,
	satellites: m.setup_check_satellites,
}

const CHECK_DETAILS: Record<
	SetupCheck["id"],
	(status: SetupCheckStatus, detail: string | null) => string
> = {
	health: (status, detail) =>
		status === "ok" ? m.setup_check_health_ok() : (detail ?? ""),
	identity: (status, detail) =>
		status === "ok"
			? m.setup_check_identity_ok({ name: detail ?? "" })
			: (detail ?? m.setup_check_identity_missing()),
	engines: (status, detail) =>
		status === "ok"
			? m.setup_check_engines_ok({ count: detail ?? "0" })
			: m.setup_check_engines_missing({ list: detail ?? "" }),
	skills: (status, detail) =>
		status === "ok"
			? m.setup_check_skills_ok({ count: detail ?? "0" })
			: status === "warn"
				? m.skills_health_engine_off()
				: m.setup_check_skills_down({ list: detail ?? "" }),
	satellites: (status, detail) =>
		status === "ok"
			? m.setup_check_satellites_ok({ count: detail ?? "0" })
			: status === "warn"
				? m.setup_check_satellites_none()
				: (detail ?? ""),
}

export function VerifyStep({
	domiaKey,
	online,
	onFinish,
}: SetupStepProps & { onFinish: () => void }) {
	const query = useQuery({
		...setupVerificationQueryOptions(domiaKey),
		enabled: online,
	})

	const verification = query.data?.ok ? query.data.data : null

	return (
		<StepShell
			title={m.setup_verify_title()}
			description={m.setup_verify_desc()}
			primary={
				<>
					<Button
						type="button"
						variant="outline"
						disabled={!online || query.isFetching}
						onClick={() => void query.refetch()}
					>
						{query.isFetching ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<RefreshCw className="size-4" />
						)}
						{m.setup_verify_recheck()}
					</Button>
					<ContinueButton onClick={onFinish} label={m.setup_finish()} />
				</>
			}
		>
			{!online ? (
				<p className="text-muted-foreground text-sm">{m.health_offline()}</p>
			) : query.isLoading ? (
				<div className="text-muted-foreground flex items-center gap-2 text-sm">
					<Loader2 className="size-4 animate-spin" />
					{m.health_checking()}
				</div>
			) : query.isError ? (
				<p className="text-destructive text-sm">{m.err_setup_verify()}</p>
			) : query.data && !query.data.ok ? (
				<p className="text-destructive text-sm">{errText(query.data.error)}</p>
			) : verification ? (
				<div className="space-y-2">
					{verification.checks.map((c) => {
						const { icon: Icon, className } = STATUS[c.status]
						return (
							<div
								key={c.id}
								className="flex items-start justify-between gap-4 rounded-lg border px-3 py-2.5"
							>
								<div className="min-w-0 space-y-0.5">
									<p className="text-sm font-medium">{CHECK_LABELS[c.id]()}</p>
									<p className="text-muted-foreground text-xs">
										{c.error
											? errText(c.error)
											: CHECK_DETAILS[c.id](c.status, c.detail)}
									</p>
								</div>
								<Icon className={`mt-0.5 size-4 shrink-0 ${className}`} />
							</div>
						)
					})}
				</div>
			) : null}
		</StepShell>
	)
}
