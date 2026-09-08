import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { SetupWizard } from "@/components/setup/setup-wizard"
import { SETUP_STEPS } from "@/constants/setup"
import { m } from "@/paraglide/messages"
import type { SetupStepId } from "@/types/setup"

const isStep = (v: unknown): v is SetupStepId =>
	typeof v === "string" && (SETUP_STEPS as readonly string[]).includes(v)

export const Route = createFileRoute("/_dashboard/setup")({
	validateSearch: (search: Record<string, unknown>) => ({
		domia: typeof search.domia === "string" ? search.domia : undefined,
		step: isStep(search.step) ? search.step : undefined,
	}),
	head: () => ({ meta: [{ title: m.meta_title({ page: m.setup_title() }) }] }),
	component: SetupPage,
})

function SetupPage() {
	const { domia, step } = Route.useSearch()
	return (
		<div className="space-y-6">
			<PageHeader title={m.setup_title()} description={m.setup_description()} />
			<SetupWizard domiaKey={domia} step={step ?? SETUP_STEPS[0]} />
		</div>
	)
}
