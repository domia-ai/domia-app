import { useEffect, useState } from "react"
import { Link, createFileRoute } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
	Field,
	FieldDescription,
	FieldError,
	FieldLabel,
} from "@/components/ui/field"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { PageHeader } from "@/components/shell/page-header"
import {
	nodeConfigQueryOptions,
	nodeQueryOptions,
	updateNodeConfigFn,
} from "@/server/nodes"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useActionQuery, useDataQuery } from "@/hooks/use-query-state"
import {
	validateBoundedInt,
	validateOptionalHttpUrl,
} from "@/utils/config-validation"
import { unitLabel } from "@/utils/config"
import { isDemoMode } from "@/lib/demo"
import { m } from "@/paraglide/messages"
import type { NodeConfigNumericField, NodeConfigSection } from "@/types/nodes"

export const Route = createFileRoute("/_dashboard/nodes/$nodeId_/config")({
	head: () => ({
		meta: [{ title: m.meta_title({ page: m.route_node_config() }) }],
	}),
	component: NodeConfigPage,
})

const PUBLIC_AUDIO_BASE_URL_MAX_CHARS = 512

const numericFields = (): NodeConfigNumericField[] => [
	{
		key: "meshControlToleranceMs",
		label: m.node_cfg_mesh_tolerance(),
		hint: m.node_cfg_mesh_tolerance_hint(),
		unit: "ms",
		min: 1_000,
		max: 600_000,
	},
	{
		key: "meshDropWarnWindowMs",
		label: m.node_cfg_mesh_drop_warn(),
		hint: m.node_cfg_mesh_drop_warn_hint(),
		unit: "ms",
		min: 0,
		max: 3_600_000,
	},
	{
		key: "modelDownloadTimeoutMs",
		label: m.node_cfg_model_timeout(),
		hint: m.node_cfg_model_timeout_hint(),
		unit: "ms",
		min: 1_000,
		max: 21_600_000,
	},
	{
		key: "modelInstallMaxBytes",
		label: m.node_cfg_model_max_bytes(),
		hint: m.node_cfg_model_max_bytes_hint(),
		unit: "bytes",
		min: 1,
		max: 274_877_906_944,
	},
	{
		key: "modelInstallMaxRedirects",
		label: m.node_cfg_model_redirects(),
		hint: m.node_cfg_model_redirects_hint(),
		unit: "redirects",
		min: 0,
		max: 20,
	},
	{
		key: "modelInstallMaxConcurrentJobs",
		label: m.node_cfg_model_jobs(),
		hint: m.node_cfg_model_jobs_hint(),
		unit: "jobs",
		min: 1,
		max: 8,
	},
	{
		key: "modelJobRetentionMs",
		label: m.node_cfg_job_retention(),
		hint: m.node_cfg_job_retention_hint(),
		unit: "ms",
		min: 0,
		max: 604_800_000,
	},
]

const toDraft = (node: NodeConfigSection): Record<string, string> => ({
	meshControlToleranceMs: String(node.meshControlToleranceMs),
	meshDropWarnWindowMs: String(node.meshDropWarnWindowMs),
	modelDownloadTimeoutMs: String(node.modelDownloadTimeoutMs),
	modelInstallMaxBytes: String(node.modelInstallMaxBytes),
	modelInstallMaxRedirects: String(node.modelInstallMaxRedirects),
	modelInstallMaxConcurrentJobs: String(node.modelInstallMaxConcurrentJobs),
	modelJobRetentionMs: String(node.modelJobRetentionMs),
	publicAudioBaseUrl: node.publicAudioBaseUrl ?? "",
})

const draftErrors = (draft: Record<string, string>): Record<string, string> => {
	const errors: Record<string, string> = {}
	for (const field of numericFields()) {
		const error = validateBoundedInt(draft[field.key] ?? "", field)
		if (error) errors[field.key] = error
	}
	const urlError = validateOptionalHttpUrl(
		draft.publicAudioBaseUrl ?? "",
		PUBLIC_AUDIO_BASE_URL_MAX_CHARS,
	)
	if (urlError) errors.publicAudioBaseUrl = urlError
	return errors
}

const changedFields = (
	draft: Record<string, string>,
	node: NodeConfigSection,
): Partial<NodeConfigSection> => {
	const patch: Partial<NodeConfigSection> = {}
	for (const { key } of numericFields()) {
		const next = Number(draft[key].trim())
		if (next !== node[key]) patch[key] = next
	}
	const url = draft.publicAudioBaseUrl.trim()
	const nextUrl = url.length > 0 ? url : null
	if (nextUrl !== node.publicAudioBaseUrl) patch.publicAudioBaseUrl = nextUrl
	return patch
}

function NodeConfigPage() {
	const { nodeId } = Route.useParams()
	const queryClient = useQueryClient()
	const { state: nodeState } = useDataQuery({
		...nodeQueryOptions(nodeId),
		errorMessage: m.nodes_not_found,
	})
	const node = nodeState.status === "ready" ? nodeState.data : null
	const anchor =
		node?.hosted.find((i) => i.isPrincipal)?.domiaKey ??
		node?.hosted[0]?.domiaKey ??
		""
	const { state: configState } = useActionQuery({
		...nodeConfigQueryOptions(anchor),
		errorMessage: m.node_cfg_unreachable,
	})
	const [draft, setDraft] = useState<Record<string, string> | null>(null)

	const snapshot = configState.status === "ready" ? configState.data : undefined

	useEffect(() => {
		if (snapshot) setDraft(toDraft(snapshot.node))
	}, [snapshot])

	const mutation = useActionMutation({
		mutationFn: (patch: Partial<NodeConfigSection>) =>
			updateNodeConfigFn({ data: { anchorDomiaKey: anchor, node: patch } }),
		failureTitle: m.node_cfg_save_failed,
		onDone: (data) => {
			toast.success(m.node_cfg_saved(), {
				description: m.node_cfg_saved_desc({
					revision: data?.revision ?? snapshot?.revision ?? "—",
					reloaded: data?.reloaded.join(", ") || "—",
				}),
			})
			void queryClient.invalidateQueries({ queryKey: ["node-config", anchor] })
		},
	})

	const errors = draft ? draftErrors(draft) : {}
	const hasErrors = Object.keys(errors).length > 0

	const onSave = () => {
		if (!draft || !snapshot || hasErrors) return
		const patch = changedFields(draft, snapshot.node)
		if (Object.keys(patch).length === 0) {
			toast.info(m.node_cfg_no_changes())
			return
		}
		mutation.mutate(patch)
	}

	return (
		<AsyncBoundary
			state={nodeState}
			skeleton={
				<p className="text-muted-foreground text-sm">{m.nodes_loading()}</p>
			}
		>
			{(detail) =>
				detail ? (
					<div className="space-y-6">
						<PageHeader
							title={m.node_cfg_title()}
							description={`${detail.localIp}:${detail.httpPort}`}
							actions={
								<Button
									variant="outline"
									size="sm"
									render={
										<Link to="/nodes/$nodeId" params={{ nodeId }}>
											<ArrowLeft className="size-4" />
											{m.node_cfg_back()}
										</Link>
									}
								/>
							}
						/>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									{m.node_cfg_section_title()}
									{snapshot && (
										<Badge variant="outline">
											{m.node_cfg_revision({ revision: snapshot.revision })}
										</Badge>
									)}
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-muted-foreground text-sm">
									{m.node_cfg_description()}
								</p>

								{anchor.length === 0 ? (
									<p className="text-destructive text-sm">
										{m.node_cfg_no_anchor()}
									</p>
								) : (
									<AsyncBoundary
										state={configState}
										skeleton={
											<p className="text-muted-foreground text-sm">
												{m.node_cfg_loading()}
											</p>
										}
									>
										{(snap) =>
											draft && snap ? (
												<div className="grid gap-4 sm:grid-cols-2">
													{numericFields().map((field) => (
														<Field
															key={field.key}
															data-invalid={Boolean(errors[field.key])}
														>
															<FieldLabel
																htmlFor={field.key}
																className="flex items-center gap-1.5"
															>
																{field.label}
																<span className="text-muted-foreground text-xs font-normal">
																	({unitLabel(field.unit)})
																</span>
															</FieldLabel>
															<Input
																id={field.key}
																type="number"
																inputMode="numeric"
																step={1}
																min={field.min}
																max={field.max}
																aria-invalid={
																	errors[field.key] ? true : undefined
																}
																value={draft[field.key]}
																onChange={(e) =>
																	setDraft({
																		...draft,
																		[field.key]: e.target.value,
																	})
																}
															/>
															<FieldDescription>{field.hint}</FieldDescription>
															<FieldError className="text-xs">
																{errors[field.key]}
															</FieldError>
														</Field>
													))}
													<Field
														className="sm:col-span-2"
														data-invalid={Boolean(errors.publicAudioBaseUrl)}
													>
														<FieldLabel htmlFor="publicAudioBaseUrl">
															{m.node_cfg_public_audio()}
														</FieldLabel>
														<Input
															id="publicAudioBaseUrl"
															value={draft.publicAudioBaseUrl}
															placeholder="https://domia.example.com"
															maxLength={PUBLIC_AUDIO_BASE_URL_MAX_CHARS}
															aria-invalid={
																errors.publicAudioBaseUrl ? true : undefined
															}
															onChange={(e) =>
																setDraft({
																	...draft,
																	publicAudioBaseUrl: e.target.value,
																})
															}
														/>
														<FieldDescription>
															{m.node_cfg_public_audio_hint()}
														</FieldDescription>
														<FieldError className="text-xs">
															{errors.publicAudioBaseUrl}
														</FieldError>
													</Field>
												</div>
											) : null
										}
									</AsyncBoundary>
								)}

								<div className="flex justify-end">
									<Button
										onClick={onSave}
										disabled={
											!draft ||
											hasErrors ||
											mutation.isPending ||
											isDemoMode() ||
											!snapshot
										}
									>
										{mutation.isPending && (
											<Loader2 className="size-4 animate-spin" />
										)}
										{m.node_cfg_save()}
									</Button>
								</div>
							</CardContent>
						</Card>
					</div>
				) : (
					<p className="text-destructive text-sm">{m.nodes_not_found()}</p>
				)
			}
		</AsyncBoundary>
	)
}
