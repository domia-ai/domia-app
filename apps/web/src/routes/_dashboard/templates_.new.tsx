import { useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Layers, Loader2, Sparkles } from "lucide-react"
import { ConfigWorkspace } from "@/components/domia/config/config-workspace"
import { Badge } from "@/components/ui/badge"
import { configQueryOptions } from "@/server/config"
import { domiaTargetsQueryOptions } from "@/server/fleet"
import { templatesQueryOptions } from "@/server/templates"
import { DEFAULT_CONFIG_SNAPSHOT } from "@/constants/config-defaults"
import { accentFor } from "@/utils/accent"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/templates_/new")({
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.route_template_new() }) }],
	}),
	component: NewTemplatePage,
})

function NewTemplatePage() {
	const navigate = Route.useNavigate()
	const [choice, setChoice] = useState<string | null>(null)

	const isDomiaClone = choice?.startsWith("d:") ?? false
	const isTemplateClone = choice?.startsWith("t:") ?? false
	const domiaKey = isDomiaClone ? choice!.slice(2) : ""
	const templateId = isTemplateClone ? choice!.slice(2) : ""

	const targetsQuery = useQuery(domiaTargetsQueryOptions())
	const templatesQuery = useQuery(templatesQueryOptions())
	const configQuery = useQuery({
		...configQueryOptions(domiaKey),
		enabled: isDomiaClone,
	})

	const allTargets = targetsQuery.data ?? []
	const templates = templatesQuery.data ?? []
	const sourceDomia = (targetsQuery.data ?? []).find(
		(t) => t.domiaKey === domiaKey,
	)
	const sourceTemplate = templates.find((t) => t.id === templateId)
	const result = configQuery.data

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
					{m.route_template_new()}
				</h1>
				<p className="text-muted-foreground text-sm">
					{choice === "scratch"
						? m.tpl_new_desc_scratch()
						: isTemplateClone
							? m.tpl_new_desc_template_clone({
									name: sourceTemplate?.name ?? m.tpl_new_a_template(),
								})
							: isDomiaClone
								? m.tpl_new_desc_domia_clone({
										name: sourceDomia?.name ?? domiaKey,
									})
								: m.tpl_new_desc_default()}
				</p>
			</div>

			{choice === null ? (
				<div className="space-y-5">
					<button
						type="button"
						onClick={() => setChoice("scratch")}
						className="hover:border-primary hover:bg-muted/40 flex w-full items-center gap-3 rounded-lg border border-dashed px-4 py-4 text-left transition-colors"
					>
						<div className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-full">
							<Sparkles className="size-4" />
						</div>
						<div>
							<p className="text-sm font-medium">{m.tpl_new_start_scratch()}</p>
							<p className="text-muted-foreground text-xs">
								{m.tpl_new_start_scratch_hint()}
							</p>
						</div>
					</button>

					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
							{m.tpl_new_clone_template()}
						</p>
						{templatesQuery.isLoading ? (
							<div className="text-muted-foreground flex items-center gap-2 text-sm">
								<Loader2 className="size-4 animate-spin" />
								{m.tpl_new_loading_templates()}
							</div>
						) : templatesQuery.isError ? (
							<p className="text-destructive text-sm">
								{m.tpl_new_templates_load_failed()}
							</p>
						) : templates.length > 0 ? (
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{templates.map((t) => (
									<button
										key={t.id}
										type="button"
										onClick={() => setChoice(`t:${t.id}`)}
										className="hover:border-primary hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
									>
										<div className="bg-muted text-muted-foreground flex size-9 items-center justify-center rounded-full">
											<Layers className="size-4" />
										</div>
										<div className="min-w-0 space-y-0.5">
											<div className="flex items-center gap-1.5">
												<p className="truncate text-sm font-medium">{t.name}</p>
												{t.isSystem && (
													<Badge variant="secondary" className="text-[10px]">
														{m.templates_system_badge()}
													</Badge>
												)}
											</div>
											<p className="text-muted-foreground truncate text-xs">
												{t.description || m.templates_no_description()}
											</p>
										</div>
									</button>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">
								{m.tpl_new_no_templates()}
							</p>
						)}
					</div>

					{targetsQuery.isLoading ? (
						<div className="text-muted-foreground flex items-center gap-2 text-sm">
							<Loader2 className="size-4 animate-spin" />
							{m.tpl_new_loading_domias()}
						</div>
					) : targetsQuery.isError ? (
						<p className="text-destructive text-sm">
							{m.tpl_new_domias_load_failed()}
						</p>
					) : allTargets.length > 0 ? (
						<div className="space-y-2">
							<p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
								{m.tpl_new_clone_domia()}
							</p>
							<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
								{allTargets.map((t) => (
									<button
										key={t.domiaKey}
										type="button"
										onClick={() => setChoice(`d:${t.domiaKey}`)}
										className="hover:border-primary hover:bg-muted/40 flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
									>
										<div
											className="text-background flex size-9 items-center justify-center rounded-full text-sm font-semibold"
											style={{ backgroundColor: accentFor(t.domiaKey) }}
											aria-hidden
										>
											{t.name.charAt(0)}
										</div>
										<div className="min-w-0">
											<p className="truncate text-sm font-medium">{t.name}</p>
											<p className="text-muted-foreground font-mono text-xs">
												{t.domiaKey}
												{!t.online ? m.tpl_new_offline_suffix() : ""}
											</p>
										</div>
									</button>
								))}
							</div>
						</div>
					) : null}
				</div>
			) : choice === "scratch" ? (
				<ConfigWorkspace
					domiaKey=""
					domiaName={m.route_template_new()}
					config={DEFAULT_CONFIG_SNAPSHOT}
					online
					accent={accentFor("template")}
					mode="template"
					onSaved={back}
				/>
			) : isTemplateClone ? (
				sourceTemplate ? (
					<ConfigWorkspace
						domiaKey=""
						domiaName={m.tpl_new_copy_of({ name: sourceTemplate.name })}
						config={{ ...DEFAULT_CONFIG_SNAPSHOT, ...sourceTemplate.config }}
						online
						accent={accentFor(sourceTemplate.id)}
						mode="template"
						onSaved={back}
					/>
				) : (
					<p className="text-destructive py-16 text-center text-sm">
						{m.tpl_new_gone()}
					</p>
				)
			) : configQuery.isLoading ? (
				<div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
					<Loader2 className="size-4 animate-spin" />
					Loading {sourceDomia?.name ?? domiaKey}'s configuration…
				</div>
			) : configQuery.isError || (result && !result.ok) ? (
				<p className="text-destructive py-16 text-center text-sm">
					Could not load that Domia's configuration.
				</p>
			) : result?.ok && result.data ? (
				<ConfigWorkspace
					domiaKey={domiaKey}
					domiaName={sourceDomia?.name ?? domiaKey}
					config={result.data}
					online
					accent={accentFor(domiaKey)}
					mode="template"
					onSaved={back}
				/>
			) : null}
		</div>
	)
}
