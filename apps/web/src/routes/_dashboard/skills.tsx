import { createFileRoute } from "@tanstack/react-router"
import { PageHeader } from "@/components/shell/page-header"
import { ComingSoon } from "@/components/shell/coming-soon"

export const Route = createFileRoute("/_dashboard/skills")({
	head: () => ({ meta: [{ title: "Skills | Domia Console" }] }),
	component: SkillsPage,
})

function SkillsPage() {
	return (
		<div className="space-y-6">
			<PageHeader
				title="Skills"
				description="MCP servers wired into the fleet and their tool-call history."
			/>
			<ComingSoon />
		</div>
	)
}
