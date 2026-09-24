import { useMemo, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import {
	ArrowDownToLine,
	ArrowUpFromLine,
	BookmarkPlus,
	Eye,
	EyeOff,
	TriangleAlert,
} from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useActionQuery } from "@/hooks/use-query-state"
import {
	importMindFn,
	mindExportQueryOptions,
	savePersonaTemplateFn,
} from "@/server/mind-transfer"
import { mindBundleSchema } from "@/schemas/mind-transfer"
import {
	MIND_CHARACTER_SECTION,
	MIND_REPORT_COUNTS,
	MIND_SECTIONS,
	MIND_SECTION_LABELS,
} from "@/constants/mind-transfer"
import { isDemoMode } from "@/lib/demo"
import type {
	MindBundle,
	MindImportMode,
	MindImportReport,
	MindImportReportViewProps,
	MindSection,
	MindSectionChecklistProps,
	MindTransferCardProps,
} from "@/types/mind-transfer"

const parseBundle = (raw: string): MindBundle | null => {
	try {
		const parsed = mindBundleSchema.safeParse(JSON.parse(raw))
		return parsed.success ? parsed.data : null
	} catch {
		return null
	}
}

const sectionCounts = (
	bundle: MindBundle,
): Partial<Record<MindSection, number>> =>
	Object.fromEntries(
		MIND_SECTIONS.filter((name) => bundle.sections[name]).map((name) => [
			name,
			bundle.sections[name]?.rows.length ?? 0,
		]),
	)

const filledSections = (bundle: MindBundle): MindSection[] =>
	MIND_SECTIONS.filter((name) => bundle.sections[name])

const exportHref = (domiaKey: string, sections: MindSection[]): string => {
	const base = `/api/mind-export?domia=${encodeURIComponent(domiaKey)}`
	return sections.length === MIND_SECTIONS.length
		? base
		: `${base}&sections=${encodeURIComponent(sections.join(","))}`
}

function SectionChecklist({
	available,
	selected,
	counts,
	disabled,
	onToggle,
}: MindSectionChecklistProps) {
	return (
		<div className="grid gap-1 sm:grid-cols-2">
			{available.map((name) => (
				<label
					key={name}
					className="hover:bg-muted flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs"
				>
					<Checkbox
						checked={selected.includes(name)}
						disabled={disabled}
						onCheckedChange={() => onToggle(name)}
					/>
					<span className="truncate">{MIND_SECTION_LABELS[name]()}</span>
					{counts?.[name] !== undefined && (
						<Badge variant="secondary" className="ml-auto shrink-0 font-mono">
							{counts[name]}
						</Badge>
					)}
				</label>
			))}
		</div>
	)
}

function ImportReportView({ report }: MindImportReportViewProps) {
	const rows = MIND_SECTIONS.filter((name) => report.sections[name])
	return (
		<div className="space-y-2 rounded-lg border p-3">
			<p className="text-sm font-medium">{m.mind_import_report_title()}</p>
			{rows.length === 0 ? (
				<p className="text-muted-foreground text-xs">{m.mind_export_empty()}</p>
			) : (
				<ul className="space-y-1">
					{rows.map((name) => {
						const section = report.sections[name]
						if (!section) return null
						return (
							<li key={name} className="flex flex-wrap items-center gap-2">
								<span className="text-xs font-medium">
									{MIND_SECTION_LABELS[name]()}
								</span>
								{MIND_REPORT_COUNTS.filter(
									(count) => section[count.key] > 0,
								).map((count) => (
									<Badge
										key={count.key}
										variant="outline"
										className="font-mono text-[11px]"
									>
										{count.label()} {section[count.key]}
									</Badge>
								))}
							</li>
						)
					})}
				</ul>
			)}
			{report.preexistingForeignKeyViolations > 0 && (
				<p className="text-muted-foreground text-xs">
					{m.mind_import_fk_note({
						count: report.preexistingForeignKeyViolations,
					})}
				</p>
			)}
		</div>
	)
}

export function MindTransferCard({
	domiaKey,
	domiaName,
	online,
}: MindTransferCardProps) {
	const demo = isDemoMode()
	const blocked = demo || !online
	const router = useRouter()
	const queryClient = useQueryClient()
	const fileRef = useRef<HTMLInputElement>(null)

	const [exportSections, setExportSections] = useState<MindSection[]>([
		...MIND_SECTIONS,
	])
	const [preview, setPreview] = useState(false)

	const [bundle, setBundle] = useState<MindBundle | null>(null)
	const [fileLabel, setFileLabel] = useState("")
	const [fileError, setFileError] = useState<string | null>(null)
	const [importSections, setImportSections] = useState<MindSection[]>([])
	const [mode, setMode] = useState<MindImportMode>("merge")
	const [confirmOpen, setConfirmOpen] = useState(false)
	const [typed, setTyped] = useState("")
	const [report, setReport] = useState<MindImportReport | null>(null)

	const [templateOpen, setTemplateOpen] = useState(false)
	const [templateName, setTemplateName] = useState("")
	const [templateDescription, setTemplateDescription] = useState("")

	const { state: previewState } = useActionQuery<string, string[]>({
		...mindExportQueryOptions(domiaKey),
		enabled: preview && online,
		errorMessage: m.mind_export_failed,
	})

	const previewCounts = useMemo(() => {
		if (previewState.status !== "ready" || !previewState.data) return null
		const parsed = parseBundle(previewState.data)
		return parsed ? sectionCounts(parsed) : null
	}, [previewState])

	const toggle = (
		list: MindSection[],
		setList: (next: MindSection[]) => void,
		name: MindSection,
	) =>
		setList(
			list.includes(name)
				? list.filter((s) => s !== name)
				: MIND_SECTIONS.filter((s) => s === name || list.includes(s)),
		)

	const readFile = async (file: File | undefined) => {
		if (!file) return
		const parsed = parseBundle(await file.text())
		setReport(null)
		if (!parsed) {
			setBundle(null)
			setFileLabel(file.name)
			setFileError(m.mind_import_invalid_file())
			return
		}
		setFileError(null)
		setFileLabel(file.name)
		setBundle(parsed)
		setImportSections(filledSections(parsed))
		setTemplateName(parsed.sourceDomiaKey)
	}

	const invalidate = () =>
		Promise.all([
			queryClient.invalidateQueries({ queryKey: ["fleet"] }),
			queryClient.invalidateQueries({ queryKey: ["config", domiaKey] }),
			queryClient.invalidateQueries({ queryKey: ["knowledge", domiaKey] }),
			queryClient.invalidateQueries({ queryKey: ["mind-export", domiaKey] }),
		])

	const importMutation = useActionMutation({
		mutationFn: () =>
			importMindFn({
				data: {
					domiaKey,
					bundleJson: JSON.stringify(bundle),
					mode,
					sections: importSections.length > 0 ? importSections : undefined,
				},
			}),
		failureTitle: m.mind_import_failed,
		onDone: (data) => {
			toast.success(m.mind_import_done())
			setReport(data ?? null)
			setConfirmOpen(false)
			setTyped("")
			void invalidate()
			void router.invalidate()
		},
	})

	const templateMutation = useActionMutation({
		mutationFn: () =>
			savePersonaTemplateFn({
				data: {
					name: templateName.trim(),
					description: templateDescription.trim(),
					bundleJson: JSON.stringify(bundle),
				},
			}),
		failureTitle: m.mind_template_failed,
		onDone: () => {
			toast.success(m.mind_template_saved())
			setTemplateOpen(false)
			setTemplateDescription("")
			void queryClient.invalidateQueries({ queryKey: ["templates"] })
		},
	})

	const downloadDisabled = !online || exportSections.length === 0
	const confirmed = typed.trim() === domiaName.trim()
	const hasPersona = !!bundle?.sections[MIND_CHARACTER_SECTION]

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{m.mind_export_title()}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<p className="text-muted-foreground text-sm">
						{m.mind_export_hint()}
					</p>
					<p className="text-xs font-medium">
						{m.mind_export_sections_label()}
					</p>
					<SectionChecklist
						available={MIND_SECTIONS}
						selected={exportSections}
						counts={previewCounts ?? undefined}
						onToggle={(name) => toggle(exportSections, setExportSections, name)}
					/>
					<div className="flex flex-wrap items-center gap-2">
						{downloadDisabled ? (
							<Button size="sm" disabled>
								<ArrowDownToLine className="size-4" />
								{m.mind_export_download()}
							</Button>
						) : (
							<Button
								size="sm"
								render={
									<a href={exportHref(domiaKey, exportSections)} download />
								}
							>
								<ArrowDownToLine className="size-4" />
								{m.mind_export_download()}
							</Button>
						)}
						<Button
							variant="outline"
							size="sm"
							disabled={!online}
							onClick={() => setPreview(!preview)}
						>
							{preview ? (
								<EyeOff className="size-4" />
							) : (
								<Eye className="size-4" />
							)}
							{preview ? m.mind_export_preview_hide() : m.mind_export_preview()}
						</Button>
					</div>
					{preview && (
						<AsyncBoundary
							state={previewState}
							skeleton={<Skeleton className="h-10 w-full" />}
						>
							{() => (
								<p className="text-muted-foreground text-xs">
									{previewCounts
										? m.mind_export_preview_total({
												rows: Object.values(previewCounts).reduce(
													(sum, n) => sum + n,
													0,
												),
												sections: Object.keys(previewCounts).length,
											})
										: m.mind_export_empty()}
								</p>
							)}
						</AsyncBoundary>
					)}
					{!online && (
						<p className="text-muted-foreground text-xs">
							{m.mind_export_offline_hint()}
						</p>
					)}
				</div>

				<div className="space-y-3 border-t pt-6">
					<p className="text-sm font-medium">{m.mind_import_title()}</p>
					<p className="text-muted-foreground text-sm">
						{m.mind_import_hint()}
					</p>
					<input
						ref={fileRef}
						type="file"
						accept="application/json,.json"
						className="hidden"
						onChange={(e) => {
							const file = e.target.files?.[0]
							e.target.value = ""
							void readFile(file)
						}}
					/>
					<div className="flex flex-wrap items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => fileRef.current?.click()}
						>
							<ArrowUpFromLine className="size-4" />
							{m.mind_import_choose_file()}
						</Button>
						<span className="text-muted-foreground text-xs">
							{fileLabel || m.mind_import_no_file()}
						</span>
					</div>
					{fileError && <p className="text-destructive text-xs">{fileError}</p>}

					{bundle && (
						<div className="space-y-3">
							<p className="text-muted-foreground text-xs">
								{m.mind_import_source({
									key: bundle.sourceDomiaKey,
									date: bundle.exportedAt,
								})}
							</p>
							<p className="text-xs font-medium">
								{m.mind_import_sections_label()}
							</p>
							<SectionChecklist
								available={filledSections(bundle)}
								selected={importSections}
								counts={sectionCounts(bundle)}
								onToggle={(name) =>
									toggle(importSections, setImportSections, name)
								}
							/>
							<div className="flex flex-wrap items-center gap-2">
								<span className="text-xs font-medium">
									{m.mind_import_mode_label()}
								</span>
								<Select
									value={mode}
									onValueChange={(value) =>
										value && setMode(value as MindImportMode)
									}
									items={[
										{ value: "merge", label: m.mind_import_mode_merge() },
										{ value: "replace", label: m.mind_import_mode_replace() },
									]}
								>
									<SelectTrigger className="h-8 w-40">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="merge">
											{m.mind_import_mode_merge()}
										</SelectItem>
										<SelectItem value="replace">
											{m.mind_import_mode_replace()}
										</SelectItem>
									</SelectContent>
								</Select>
							</div>
							{mode === "replace" && (
								<p className="text-destructive flex items-start gap-2 text-xs">
									<TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
									{m.mind_import_replace_warning({ name: domiaName })}
								</p>
							)}
							<div className="flex flex-wrap items-center gap-2">
								<Dialog
									open={confirmOpen}
									onOpenChange={(next) => {
										setConfirmOpen(next)
										if (!next) setTyped("")
									}}
								>
									<DialogTrigger
										render={
											<Button
												size="sm"
												variant={mode === "replace" ? "destructive" : "default"}
												disabled={blocked || importSections.length === 0}
											>
												{m.mind_import_action()}
											</Button>
										}
									/>
									<DialogContent className="sm:max-w-md">
										<DialogHeader>
											<DialogTitle>{m.mind_import_confirm_title()}</DialogTitle>
											<DialogDescription>
												{m.mind_import_confirm_desc({
													name: domiaName,
													source: bundle.sourceDomiaKey,
												})}
											</DialogDescription>
										</DialogHeader>
										<Field>
											<FieldLabel htmlFor="mind-import-confirm">
												{m.mind_import_type_name({ name: domiaName })}
											</FieldLabel>
											<Input
												id="mind-import-confirm"
												value={typed}
												onChange={(e) => setTyped(e.target.value)}
												placeholder={domiaName}
												autoFocus
											/>
										</Field>
										<DialogFooter className="mt-4">
											<DialogClose
												render={
													<Button type="button" variant="outline">
														{m.dlg_cancel()}
													</Button>
												}
											/>
											<Button
												type="button"
												variant={mode === "replace" ? "destructive" : "default"}
												disabled={!confirmed || importMutation.isPending}
												onClick={() => importMutation.mutate(undefined)}
											>
												{importMutation.isPending
													? m.mind_import_importing()
													: m.mind_import_action()}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>

								<Dialog open={templateOpen} onOpenChange={setTemplateOpen}>
									<DialogTrigger
										render={
											<Button
												size="sm"
												variant="outline"
												disabled={demo || !hasPersona}
											>
												<BookmarkPlus className="size-4" />
												{m.mind_template_action()}
											</Button>
										}
									/>
									<DialogContent className="sm:max-w-md">
										<DialogHeader>
											<DialogTitle>{m.mind_template_title()}</DialogTitle>
											<DialogDescription>
												{m.mind_template_desc()}
											</DialogDescription>
										</DialogHeader>
										<div className="space-y-3">
											<Field>
												<FieldLabel htmlFor="mind-template-name">
													{m.mind_template_name_label()}
												</FieldLabel>
												<Input
													id="mind-template-name"
													value={templateName}
													onChange={(e) => setTemplateName(e.target.value)}
													autoFocus
												/>
											</Field>
											<Field>
												<FieldLabel htmlFor="mind-template-description">
													{m.mind_template_description_label()}
												</FieldLabel>
												<Input
													id="mind-template-description"
													value={templateDescription}
													onChange={(e) =>
														setTemplateDescription(e.target.value)
													}
												/>
											</Field>
										</div>
										<DialogFooter className="mt-4">
											<DialogClose
												render={
													<Button type="button" variant="outline">
														{m.dlg_cancel()}
													</Button>
												}
											/>
											<Button
												type="button"
												disabled={
													templateName.trim().length === 0 ||
													templateMutation.isPending
												}
												onClick={() => templateMutation.mutate(undefined)}
											>
												{templateMutation.isPending
													? m.mind_template_saving()
													: m.mind_template_save()}
											</Button>
										</DialogFooter>
									</DialogContent>
								</Dialog>
							</div>
							{!hasPersona && (
								<p className="text-muted-foreground text-xs">
									{m.mind_template_no_persona()}
								</p>
							)}
						</div>
					)}

					{report && <ImportReportView report={report} />}
				</div>
			</CardContent>
		</Card>
	)
}
