import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { LivekitLab } from "@/components/lab/livekit-lab"
import { getMeshDomiasFn } from "@/server/overview"

export const Route = createFileRoute("/_dashboard/lab/livekit")({
	head: () => ({ meta: [{ title: "LiveKit Lab — Domia" }] }),
	loader: () => getMeshDomiasFn(),
	component: LivekitLabPage,
})

function LivekitLabPage() {
	const domias = Route.useLoaderData()
	return (
		<div className="space-y-6">
			<PageHeader
				title="LiveKit Lab"
				description="Hidden test bench: talk to a Domia through a LiveKit room from this browser."
			/>
			<LivekitLab domias={domias} />
		</div>
	)
}
