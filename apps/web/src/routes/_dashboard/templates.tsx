import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { Plus } from "lucide-react"
import { PageHeader } from "@/components/shell/page-header"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { TemplateCard } from "@/components/templates/template-card"
import { templatesQueryOptions } from "@/server/templates"
import { domiaTargetsQueryOptions } from "@/server/fleet"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/templates")({
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.nav_templates() }) }],
	}),
	loader: ({ context }) =>
		Promise.all([
			context.queryClient.ensureQueryData(templatesQueryOptions()),
			context.queryClient.ensureQueryData(domiaTargetsQueryOptions()),
		]),
	component: TemplatesPage,
})

function TemplatesPage() {
	const templatesQuery = useQuery(templatesQueryOptions())
	const targetsQuery = useQuery(domiaTargetsQueryOptions())

	const templates = templatesQuery.data ?? []
	const targets = targetsQuery.data ?? []

	return (
		<div className="space-y-6">
			<PageHeader
				title={m.nav_templates()}
				description={m.route_templates_description()}
				actions={
					<Button nativeButton={false} render={<Link to="/templates/new" />}>
						<Plus className="size-4" />
						{m.route_template_new()}
					</Button>
				}
			/>

			{templatesQuery.isLoading ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{[0, 1, 2].map((i) => (
						<Skeleton key={i} className="h-44 w-full" />
					))}
				</div>
			) : templatesQuery.isError ? (
				<p className="text-destructive text-sm">{m.templates_load_error()}</p>
			) : templates.length ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{templates.map((template) => (
						<TemplateCard
							key={template.id}
							template={template}
							targets={targets}
						/>
					))}
				</div>
			) : (
				<div className="text-muted-foreground rounded-lg border border-dashed py-16 text-center text-sm">
					{m.templates_empty()}
				</div>
			)}
		</div>
	)
}
