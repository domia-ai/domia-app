import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { ConfigWorkspace } from "@/components/domia/config/config-workspace"
import { templatesQueryOptions } from "@/server/templates"
import { accentFor } from "@/utils/accent"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/templates_/$id/edit")({
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.route_template_edit() }) }],
	}),
	component: EditTemplatePage,
})

function EditTemplatePage() {
	const navigate = Route.useNavigate()
	const { id } = Route.useParams()
	const templatesQuery = useQuery(templatesQueryOptions())

	const template = (templatesQuery.data ?? []).find((t) => t.id === id)
	const back = () => navigate({ to: "/templates" })

	return (
		<div className="space-y-6">
			<Link
				to="/templates"
				className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
			>
				<ArrowLeft className="size-4" />
				{m.nav_templates()}
			</Link>

			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					{template
						? m.tpl_edit_title({ name: template.name })
						: m.route_template_edit()}
				</h1>
				<p className="text-muted-foreground text-sm">{m.tpl_edit_desc()}</p>
			</div>

			{templatesQuery.isLoading ? (
				<div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
					<Loader2 className="size-4 animate-spin" />
					{m.tpl_edit_loading()}
				</div>
			) : templatesQuery.isError ? (
				<p className="text-destructive py-16 text-center text-sm">
					{m.tpl_edit_load_failed()}
				</p>
			) : !template ? (
				<p className="text-muted-foreground py-16 text-center text-sm">
					{m.tpl_edit_not_found()}
				</p>
			) : (
				<ConfigWorkspace
					domiaKey=""
					domiaName={template.name}
					config={template.config}
					online
					accent={accentFor(template.id)}
					mode="template"
					editTemplate={{
						id: template.id,
						name: template.name,
						description: template.description,
					}}
					onSaved={back}
				/>
			)}
		</div>
	)
}
