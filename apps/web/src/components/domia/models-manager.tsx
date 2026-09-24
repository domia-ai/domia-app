import { useEffect, useRef, useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import {
	Code2,
	Download,
	Loader2,
	CheckCircle2,
	XCircle,
	HardDrive,
} from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { modelJobDuration, modelJobSpecLabel } from "@/utils/config"
import { parseModelInstallSpec } from "@/schemas/models"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	modelsQueryOptions,
	installModelFn,
	getModelJobFn,
} from "@/server/models"
import type {
	ModelCatalogEntry,
	ModelJob,
	InstalledModel,
} from "@/types/config"

const POLL_MS = 1500

const SPEC_KINDS: ModelCatalogEntry["kind"][] = [
	"sherpa-archive",
	"file",
	"ollama",
]

const SPEC_FIELDS: Record<
	ModelCatalogEntry["kind"],
	{
		key: string
		label: () => string
		required?: boolean
		numeric?: boolean
		placeholder?: string
	}[]
> = {
	"sherpa-archive": [
		{
			key: "url",
			label: m.modelspec_field_url,
			required: true,
			placeholder: "https://…",
		},
		{ key: "target", label: m.modelspec_field_target, required: true },
		{ key: "subdir", label: m.modelspec_field_subdir },
		{ key: "sourceDir", label: m.modelspec_field_source_dir },
		{ key: "sha256", label: m.modelspec_field_sha256 },
		{ key: "sizeBytes", label: m.modelspec_field_size_bytes, numeric: true },
		{ key: "label", label: m.modelspec_field_label },
		{ key: "stage", label: m.modelspec_field_stage },
		{ key: "license", label: m.modelspec_field_license },
	],
	file: [
		{
			key: "url",
			label: m.modelspec_field_url,
			required: true,
			placeholder: "https://…",
		},
		{ key: "target", label: m.modelspec_field_target, required: true },
		{ key: "subdir", label: m.modelspec_field_subdir },
		{ key: "sha256", label: m.modelspec_field_sha256 },
		{ key: "sizeBytes", label: m.modelspec_field_size_bytes, numeric: true },
		{ key: "label", label: m.modelspec_field_label },
		{ key: "stage", label: m.modelspec_field_stage },
		{ key: "license", label: m.modelspec_field_license },
	],
	ollama: [
		{
			key: "model",
			label: m.modelspec_field_model,
			required: true,
			placeholder: "qwen2.5:7b",
		},
		{ key: "label", label: m.modelspec_field_label },
		{ key: "stage", label: m.modelspec_field_stage },
		{ key: "license", label: m.modelspec_field_license },
	],
}

const NUMERIC_SPEC_KEYS = new Set(["sizeBytes"])

const specFromFields = (
	kind: ModelCatalogEntry["kind"],
	fields: Record<string, string>,
): Record<string, unknown> => {
	const spec: Record<string, unknown> = { kind }
	for (const field of SPEC_FIELDS[kind]) {
		const raw = (fields[field.key] ?? "").trim()
		if (!raw) continue
		spec[field.key] = NUMERIC_SPEC_KEYS.has(field.key) ? Number(raw) : raw
	}
	return spec
}

const formatSize = (bytes: number | null): string => {
	if (bytes == null) return "—"
	if (bytes < 1024) return `${bytes} B`
	const mb = bytes / (1024 * 1024)
	if (mb < 1024) return `${mb.toFixed(1)} MB`
	return `${(mb / 1024).toFixed(2)} GB`
}

const specFromCatalog = (entry: ModelCatalogEntry): Record<string, unknown> => {
	const spec: Record<string, unknown> = { kind: entry.kind }
	if (entry.url) spec.url = entry.url
	if (entry.subdir) spec.subdir = entry.subdir
	if (entry.target) spec.target = entry.target
	if (entry.sourceDir) spec.sourceDir = entry.sourceDir
	if (entry.model) spec.model = entry.model
	return spec
}

const catalogKey = (entry: ModelCatalogEntry): string => {
	const target =
		entry.target && entry.subdir ? `${entry.subdir}/${entry.target}` : undefined
	return (
		target ??
		entry.target ??
		entry.model ??
		entry.label ??
		entry.url ??
		entry.kind
	)
}

const installedNames = (installed: InstalledModel[]): Set<string> =>
	new Set(installed.map((m) => m.name))

function JobRow({ job }: { job: ModelJob }) {
	const icon =
		job.status === "done" ? (
			<CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
		) : job.status === "error" ? (
			<XCircle className="text-destructive size-3.5" />
		) : (
			<Loader2 className="size-3.5 animate-spin" />
		)
	const duration = modelJobDuration(job)
	const spec = modelJobSpecLabel(job)
	return (
		<div className="flex items-center gap-2 text-xs">
			{icon}
			<span className="font-mono">{job.id.slice(0, 8)}</span>
			{spec && <span className="truncate font-medium">{spec}</span>}
			<span className="text-muted-foreground truncate">{job.detail}</span>
			{duration && (
				<span className="text-muted-foreground ml-auto shrink-0 font-mono tabular-nums">
					{duration}
				</span>
			)}
		</div>
	)
}

export function ModelsManager({
	domiaKey,
	online,
	enabled,
}: {
	domiaKey: string
	online: boolean
	enabled: boolean
}) {
	const queryClient = useQueryClient()
	const [jobs, setJobs] = useState<ModelJob[]>([])
	const [customSpec, setCustomSpec] = useState("")
	const [rawMode, setRawMode] = useState(false)
	const [kind, setKind] = useState<ModelCatalogEntry["kind"]>("sherpa-archive")
	const [fields, setFields] = useState<Record<string, string>>({})
	const [specError, setSpecError] = useState<string | null>(null)
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const query = useQuery({
		...modelsQueryOptions(domiaKey),
		enabled: enabled && online,
	})

	const installMutation = useActionMutation({
		mutationFn: (spec: Record<string, unknown>) =>
			installModelFn({ data: { domiaKey, spec } }),
		failureTitle: m.err_start_install,
		onDone: (job) => {
			if (!job) {
				toast.error(m.err_start_install())
				return
			}
			setJobs((prev) => [job, ...prev])
			toast.info(m.toast_install_started())
		},
	})

	const hasRunning = jobs.some((j) => j.status === "running")

	useEffect(() => {
		if (!hasRunning) {
			if (pollRef.current) {
				clearInterval(pollRef.current)
				pollRef.current = null
			}
			return
		}
		if (pollRef.current) return
		pollRef.current = setInterval(async () => {
			const running = jobs.filter((j) => j.status === "running")
			for (const job of running) {
				const res = await getModelJobFn({ data: { domiaKey, jobId: job.id } })
				if (res.ok && res.data) {
					const updated = res.data
					setJobs((prev) =>
						prev.map((j) => (j.id === updated.id ? updated : j)),
					)
					if (updated.status === "done") {
						toast.success(m.toast_model_installed())
						queryClient.invalidateQueries({ queryKey: ["models", domiaKey] })
					}
					if (updated.status === "error")
						toast.error(m.toast_install_failed(), {
							description: updated.detail,
						})
				}
			}
		}, POLL_MS)
		return () => {
			if (pollRef.current) {
				clearInterval(pollRef.current)
				pollRef.current = null
			}
		}
	}, [hasRunning, jobs, domiaKey, queryClient])

	const onInstallCustom = () => {
		let parsed: unknown
		try {
			parsed = JSON.parse(customSpec)
		} catch {
			toast.error(m.toast_invalid_json_spec())
			return
		}
		if (!parsed || typeof parsed !== "object") {
			toast.error(m.toast_spec_must_be_object())
			return
		}
		const checked = parseModelInstallSpec(parsed)
		if (!checked.ok) {
			toast.error(m.modelspec_err_invalid(), { description: checked.error })
			return
		}
		installMutation.mutate(checked.spec)
	}

	const onInstallForm = () => {
		const checked = parseModelInstallSpec(specFromFields(kind, fields))
		if (!checked.ok) {
			setSpecError(checked.error)
			return
		}
		setSpecError(null)
		installMutation.mutate(checked.spec)
	}

	if (!online)
		return (
			<p className="text-muted-foreground py-8 text-center text-sm">
				{m.models_offline()}
			</p>
		)
	if (query.isLoading)
		return (
			<div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
				<Loader2 className="size-4 animate-spin" />
				{m.models_loading()}
			</div>
		)
	if (query.isError)
		return (
			<p className="text-destructive py-8 text-center text-sm">
				{m.models_load_error()}
			</p>
		)
	const result = query.data
	if (!result?.ok || !result.data)
		return (
			<p className="text-destructive py-8 text-center text-sm">
				{result && !result.ok ? errText(result.error) : m.models_none()}
			</p>
		)

	const report = result.data
	const installed = installedNames(report.installed)

	return (
		<div className="space-y-5">
			{jobs.length > 0 && (
				<div className="bg-muted/40 space-y-1.5 rounded-lg border p-3">
					{jobs.map((job) => (
						<JobRow key={job.id} job={job} />
					))}
				</div>
			)}

			<div className="space-y-2">
				<h3 className="text-sm font-medium">{m.models_available_title()}</h3>
				{report.catalog.map((entry) => {
					const key = catalogKey(entry)
					const isInstalled = installed.has(key)
					return (
						<div
							key={key}
							className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5"
						>
							<div className="min-w-0 space-y-0.5">
								<div className="flex items-center gap-2">
									<p className="truncate text-sm font-medium">
										{entry.label ?? key}
									</p>
									{entry.stage && (
										<Badge variant="secondary" className="text-[10px]">
											{entry.stage}
										</Badge>
									)}
								</div>
								<p className="text-muted-foreground truncate font-mono text-[11px]">
									{entry.kind} · {key}
									{entry.license ? ` · ${entry.license}` : ""}
								</p>
							</div>
							{isInstalled ? (
								<Badge variant="secondary" className="gap-1 text-[11px]">
									<CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
									{m.models_installed_badge()}
								</Badge>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={installMutation.isPending}
									onClick={() => installMutation.mutate(specFromCatalog(entry))}
								>
									<Download className="size-4" />
									{m.models_install()}
								</Button>
							)}
						</div>
					)
				})}
			</div>

			<div className="space-y-2">
				<h3 className="text-sm font-medium">{m.models_installed_title()}</h3>
				{report.installed.length ? (
					<div className="space-y-1.5">
						{report.installed.map((model) => (
							<div
								key={model.name}
								className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2"
							>
								<div className="flex min-w-0 items-center gap-2">
									<HardDrive className="text-muted-foreground size-3.5 shrink-0" />
									<span className="truncate font-mono text-xs">
										{model.name}
									</span>
									<Badge variant="secondary" className="text-[10px]">
										{model.kind}
									</Badge>
								</div>
								<span className="text-muted-foreground font-mono text-xs tabular-nums">
									{formatSize(model.sizeBytes)}
								</span>
							</div>
						))}
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						{m.models_none_installed()}
					</p>
				)}
			</div>

			<div className="space-y-3 rounded-lg border border-dashed p-3">
				<div className="flex flex-wrap items-center justify-between gap-2">
					<p className="text-sm font-medium">{m.models_custom_title()}</p>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={() => setRawMode(!rawMode)}
					>
						<Code2 className="size-3.5" />
						{rawMode ? m.modelspec_mode_form() : m.modelspec_mode_raw()}
					</Button>
				</div>

				{rawMode ? (
					<>
						<p className="text-muted-foreground text-xs">
							{m.models_custom_hint()}{" "}
							<code className="font-mono">{`{ "kind": "ollama", "model": "qwen2.5:7b" }`}</code>
						</p>
						<Textarea
							value={customSpec}
							onChange={(e) => setCustomSpec(e.target.value)}
							rows={4}
							placeholder='{ "kind": "sherpa-archive", "url": "https://…", "target": "my-model", "sourceDir": "…" }'
							className="font-mono text-xs"
							spellCheck={false}
						/>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							disabled={!customSpec.trim() || installMutation.isPending}
							onClick={onInstallCustom}
						>
							<Download className="size-4" />
							{m.models_install_from_spec()}
						</Button>
					</>
				) : (
					<>
						<div className="space-y-1.5">
							<Label className="text-xs">{m.modelspec_field_kind()}</Label>
							<Select
								value={kind}
								onValueChange={(value) => {
									if (!value) return
									setKind(value as ModelCatalogEntry["kind"])
									setFields({})
									setSpecError(null)
								}}
								items={SPEC_KINDS.map((k) => ({ value: k, label: k }))}
							>
								<SelectTrigger className="h-9 w-full sm:w-64">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SPEC_KINDS.map((k) => (
										<SelectItem key={k} value={k}>
											{k}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="grid gap-3 sm:grid-cols-2">
							{SPEC_FIELDS[kind].map((field) => (
								<div key={field.key} className="space-y-1.5">
									<Label className="text-xs">
										{field.label()}
										{field.required ? " *" : ""}
									</Label>
									<Input
										className="h-9 font-mono text-xs"
										inputMode={field.numeric ? "numeric" : undefined}
										value={fields[field.key] ?? ""}
										placeholder={field.placeholder}
										spellCheck={false}
										onChange={(e) =>
											setFields({ ...fields, [field.key]: e.target.value })
										}
									/>
								</div>
							))}
						</div>

						{specError && (
							<p className="text-destructive text-xs">{specError}</p>
						)}

						<Button
							type="button"
							variant="secondary"
							size="sm"
							disabled={installMutation.isPending}
							onClick={onInstallForm}
						>
							<Download className="size-4" />
							{m.models_install_from_spec()}
						</Button>
					</>
				)}
			</div>
		</div>
	)
}
