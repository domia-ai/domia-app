import { useMemo, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import {
	AudioLines,
	Boxes,
	Brain,
	Ear,
	Loader2,
	Mic,
	Network,
	Package,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Speaker,
	Stethoscope,
	ToggleRight,
	TriangleAlert,
	User,
} from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfigSection } from "./config-section"
import { SaveTemplateDialog } from "./save-template-dialog"
import { useConfigDraft } from "@/hooks/use-config-draft"
import { configSchemaQueryOptions, importConfigFn } from "@/server/config"
import {
	FIELD_META,
	HIDDEN_FIELDS,
	SECTION_GROUP_LABELS,
	SECTION_GROUPS,
	SECTION_META,
} from "@/constants/config"
import { CONFIG_SCHEMA_SNAPSHOT } from "@/constants/config-schema"
import { buildConfigSections, fieldMatches } from "@/utils/config-schema"
import { cn } from "@/lib/utils"
import { applyNeedsAttention, summarizeApply } from "@/lib/config-apply"
import { subsystemLabel } from "@/constants/config-apply"
import type {
	ConfigApplyState,
	ConfigFetchSource,
	ConfigSchema,
	ConfigSectionDef,
	ConfigWorkspaceProps,
	SubsystemRevisionState,
} from "@/types/config"

const ICONS: Record<string, typeof User> = {
	user: User,
	audio: AudioLines,
	brain: Brain,
	ear: Ear,
	mic: Mic,
	speaker: Speaker,
	toggle: ToggleRight,
	boxes: Boxes,
	network: Network,
	sliders: SlidersHorizontal,
	stethoscope: Stethoscope,
	package: Package,
}

const driftRows = (state: ConfigApplyState): SubsystemRevisionState[] =>
	state.subsystems.filter((s) => !s.inSync || s.lastError)

function ApplyStateBanner({ state }: { state: ConfigApplyState }) {
	const rows = driftRows(state)
	if (rows.length === 0 && state.pending.length === 0) return null
	return (
		<div className="border-destructive/40 bg-destructive/5 mb-4 space-y-2 rounded-lg border px-4 py-3">
			<div className="flex items-center gap-2 text-sm font-medium">
				<TriangleAlert className="text-destructive size-4" />
				{m.apply_state_title()}
			</div>
			<p className="text-muted-foreground text-xs">{m.apply_state_hint()}</p>
			<ul className="space-y-1.5">
				{rows.map((row) => (
					<li key={row.subsystem} className="text-xs">
						<span className="font-medium">{subsystemLabel(row.subsystem)}</span>
						<span className="text-muted-foreground">
							{" · "}
							{m.apply_state_revisions({
								running: row.runningRevision,
								desired: row.desiredRevision,
							})}
						</span>
						{row.lastError && (
							<p className="text-destructive">
								{m.apply_state_error_at({
									error: row.lastError,
									at: row.lastErrorAt
										? new Date(row.lastErrorAt).toLocaleString()
										: "—",
								})}
							</p>
						)}
					</li>
				))}
			</ul>
			{state.pending.length > 0 && (
				<p className="text-muted-foreground text-xs">
					{m.apply_state_pending()}{" "}
					{state.pending.map(subsystemLabel).join(", ")}
				</p>
			)}
		</div>
	)
}

export function ConfigWorkspace(props: ConfigWorkspaceProps) {
	const schemaQuery = useQuery(configSchemaQueryOptions(props.domiaKey))

	if (schemaQuery.isLoading)
		return (
			<div className="text-muted-foreground flex items-center justify-center gap-2 py-16 text-sm">
				<Loader2 className="size-4 animate-spin" />
				{m.config_schema_loading()}
			</div>
		)

	const schema: ConfigSchema =
		schemaQuery.data?.schema ?? CONFIG_SCHEMA_SNAPSHOT
	const source: ConfigFetchSource = schemaQuery.isError
		? "snapshot"
		: (schemaQuery.data?.source ?? "snapshot")

	return (
		<ConfigWorkspaceBody
			{...props}
			schema={schema}
			schemaSource={source}
			schemaFailed={schemaQuery.isError}
		/>
	)
}

function ConfigWorkspaceBody({
	domiaKey,
	domiaName,
	config,
	online,
	mode = "live",
	onSaved,
	editTemplate,
	readOnly = false,
	applyState = null,
	schema,
	schemaSource,
	schemaFailed,
}: ConfigWorkspaceProps & {
	schema: ConfigSchema
	schemaSource: ConfigFetchSource
	schemaFailed: boolean
}) {
	const queryClient = useQueryClient()
	const router = useRouter()
	const allSections = useMemo(
		() => buildConfigSections(schema, SECTION_META, FIELD_META, HIDDEN_FIELDS),
		[schema],
	)
	const sections: ConfigSectionDef[] = domiaKey
		? allSections
		: allSections.filter((s) => s.kind !== "diagnostics" && s.kind !== "models")
	const draft = useConfigDraft(config, allSections)
	const [activeId, setActiveId] = useState(sections[0]?.id ?? "")
	const [search, setSearch] = useState("")
	const [savedState, setSavedState] = useState<ConfigApplyState | null>(null)
	const [seenState, setSeenState] = useState(applyState)
	if (seenState !== applyState) {
		setSeenState(applyState)
		setSavedState(null)
	}
	const liveApplyState = savedState ?? applyState

	const isTemplate = mode === "template"
	const snapshotConfig = draft.mergeInto(config)
	const query = search.trim().toLowerCase()
	const active = sections.find((s) => s.id === activeId) ?? sections[0]
	const changedBySection = new Map(
		draft.impact.sections.map((s) => [s.section, s.changed.length]),
	)
	const matchesBySection = new Map(
		sections.map((s) => [
			s.id,
			query ? s.fields.filter((f) => fieldMatches(f, query)).length : 0,
		]),
	)

	const importMutation = useActionMutation({
		mutationFn: (bundle: Record<string, unknown>) =>
			importConfigFn({ data: { domiaKey, bundle } }),
		failureTitle: m.toast_config_save_failed,
		onDone: (data) => {
			if (!data) {
				toast.error(m.toast_config_save_failed())
				return
			}
			draft.commit()
			queryClient.invalidateQueries({ queryKey: ["fleet"] })
			queryClient.invalidateQueries({ queryKey: ["config", domiaKey] })
			void router.invalidate()
			setSavedState(data.state ?? null)
			const apply = data.apply
			const description = apply
				? summarizeApply(apply)
				: m.toast_config_applied_fallback({ name: domiaName })
			if (apply && applyNeedsAttention(apply)) {
				toast.warning(m.toast_config_saved(), { description })
			} else {
				toast.success(m.toast_config_saved(), { description })
			}
		},
	})

	const dirty = draft.impact.totalChanged > 0

	if (!active)
		return (
			<p className="text-muted-foreground py-16 text-center text-sm">
				{m.config_schema_empty()}
			</p>
		)

	return (
		<div className="flex min-h-0 flex-col">
			{liveApplyState && <ApplyStateBanner state={liveApplyState} />}
			{(schemaSource === "snapshot" || schemaFailed) && (
				<p className="text-muted-foreground mb-4 rounded-lg border border-dashed px-4 py-2.5 text-sm">
					{schemaFailed
						? m.config_schema_failed_notice()
						: m.config_schema_snapshot_notice()}
				</p>
			)}
			<div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
				<nav className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1">
					<div className="bg-background sticky top-0 z-10 pb-1">
						<Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder={m.config_search_placeholder()}
							className="h-9 pl-8"
						/>
					</div>
					{SECTION_GROUPS.filter((group) =>
						sections.some((s) => s.group === group),
					).map((group) => (
						<div key={group} className="space-y-1">
							<p className="text-muted-foreground px-2 text-[11px] font-medium tracking-wide uppercase">
								{SECTION_GROUP_LABELS[group]()}
							</p>
							{sections
								.filter((s) => s.group === group)
								.map((section) => {
									const Icon = ICONS[section.icon] ?? SlidersHorizontal
									const count = changedBySection.get(section.id) ?? 0
									const matches = matchesBySection.get(section.id) ?? 0
									return (
										<button
											key={section.id}
											type="button"
											onClick={() => setActiveId(section.id)}
											className={cn(
												"flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
												section.id === active.id
													? "bg-muted font-medium"
													: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
												query && matches === 0 && "opacity-50",
											)}
										>
											<Icon className="size-4 shrink-0" />
											<span className="flex-1 text-left">
												{section.label()}
											</span>
											{query && matches > 0 && (
												<span className="text-muted-foreground text-[10px] tabular-nums">
													{matches}
												</span>
											)}
											{count > 0 && (
												<span className="bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full text-[10px] font-medium tabular-nums">
													{count}
												</span>
											)}
										</button>
									)
								})}
						</div>
					))}
				</nav>

				<div className="min-w-0 pb-24">
					{!isTemplate && (
						<div className="mb-4 flex justify-end">
							<SaveTemplateDialog config={snapshotConfig} />
						</div>
					)}
					<fieldset disabled={readOnly} className="contents">
						<ConfigSection
							domiaKey={domiaKey}
							section={active}
							draft={draft}
							online={online}
							search={search}
						/>
					</fieldset>
				</div>
			</div>

			{readOnly ? null : isTemplate ? (
				<div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur lg:left-[var(--sidebar-width,16rem)]">
					<div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
						<span className="text-sm">
							<span className="text-muted-foreground">
								{draft.impact.totalChanged > 0
									? m.config_template_edits_count({
											count: draft.impact.totalChanged,
										})
									: m.config_template_editing_copy()}
							</span>
							{!draft.isValid && (
								<span className="text-destructive">
									{" "}
									· {m.config_fix_invalid()}
								</span>
							)}
						</span>
						<div className="ml-auto flex items-center gap-2">
							{dirty && (
								<Button variant="ghost" onClick={draft.reset}>
									<RotateCcw className="size-4" />
									{m.config_reset()}
								</Button>
							)}
							<SaveTemplateDialog
								config={snapshotConfig}
								onSaved={onSaved}
								variant="default"
								label={
									editTemplate
										? m.config_save_changes()
										: m.config_save_template()
								}
								template={editTemplate}
								disabled={!draft.isValid}
							/>
						</div>
					</div>
				</div>
			) : (
				dirty && (
					<div className="bg-background/95 fixed inset-x-0 bottom-0 z-20 border-t backdrop-blur lg:left-[var(--sidebar-width,16rem)]">
						<div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-6 py-3">
							<span className="flex items-center gap-2 text-sm">
								<span className="font-medium">
									{m.config_unsaved_count({ count: draft.impact.totalChanged })}
								</span>
								<span className="text-muted-foreground">
									· {m.config_applying_restarts({ name: domiaName })}
								</span>
								{!draft.isValid && (
									<span className="text-destructive">
										· {m.config_fix_invalid()}
									</span>
								)}
							</span>
							<div className="ml-auto flex items-center gap-2">
								<Button variant="ghost" onClick={draft.reset}>
									<RotateCcw className="size-4" />
									{m.config_reset()}
								</Button>
								<Button
									disabled={importMutation.isPending || !draft.isValid}
									onClick={() => importMutation.mutate(draft.buildBundle())}
								>
									{importMutation.isPending
										? m.config_saving()
										: m.config_save_restart()}
								</Button>
							</div>
						</div>
					</div>
				)
			)}
		</div>
	)
}
