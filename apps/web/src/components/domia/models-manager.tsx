import { useEffect, useRef, useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
	Download,
	Loader2,
	CheckCircle2,
	XCircle,
	HardDrive,
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
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
	if (entry.target) spec.target = entry.target
	if (entry.sourceDir) spec.sourceDir = entry.sourceDir
	if (entry.model) spec.model = entry.model
	return spec
}

const catalogKey = (entry: ModelCatalogEntry): string =>
	entry.target ?? entry.model ?? entry.label ?? entry.url ?? entry.kind

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
	return (
		<div className="flex items-center gap-2 text-xs">
			{icon}
			<span className="font-mono">{job.id.slice(0, 8)}</span>
			<span className="text-muted-foreground truncate">{job.detail}</span>
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
	const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

	const query = useQuery({
		...modelsQueryOptions(domiaKey),
		enabled: enabled && online,
	})

	const installMutation = useMutation({
		mutationFn: (spec: Record<string, unknown>) =>
			installModelFn({ data: { domiaKey, spec } }),
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
						toast.success("Model installed")
						queryClient.invalidateQueries({ queryKey: ["models", domiaKey] })
					}
					if (updated.status === "error")
						toast.error("Install failed", { description: updated.detail })
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

	const onInstall = async (spec: Record<string, unknown>) => {
		const result = await installMutation.mutateAsync(spec)
		if (result.ok && result.data) {
			setJobs((prev) => [result.data!, ...prev])
			toast.info("Install started")
		} else {
			toast.error("Could not start install", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	}

	const onInstallCustom = async () => {
		let parsed: unknown
		try {
			parsed = JSON.parse(customSpec)
		} catch {
			toast.error("Invalid JSON spec")
			return
		}
		if (!parsed || typeof parsed !== "object") {
			toast.error("Spec must be an object")
			return
		}
		await onInstall(parsed as Record<string, unknown>)
	}

	if (!online)
		return (
			<p className="text-muted-foreground py-8 text-center text-sm">
				Offline — model management unavailable.
			</p>
		)
	if (query.isLoading)
		return (
			<div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
				<Loader2 className="size-4 animate-spin" />
				Loading models…
			</div>
		)
	if (query.isError)
		return (
			<p className="text-destructive py-8 text-center text-sm">
				Could not load models.
			</p>
		)
	const result = query.data
	if (!result?.ok || !result.data)
		return (
			<p className="text-destructive py-8 text-center text-sm">
				{result && !result.ok ? result.error : "No models"}
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
				<h3 className="text-sm font-medium">Available to install</h3>
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
								</p>
							</div>
							{isInstalled ? (
								<Badge variant="secondary" className="gap-1 text-[11px]">
									<CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
									Installed
								</Badge>
							) : (
								<Button
									type="button"
									variant="outline"
									size="sm"
									disabled={installMutation.isPending}
									onClick={() => onInstall(specFromCatalog(entry))}
								>
									<Download className="size-4" />
									Install
								</Button>
							)}
						</div>
					)
				})}
			</div>

			<div className="space-y-2">
				<h3 className="text-sm font-medium">Installed</h3>
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
					<p className="text-muted-foreground text-sm">No models installed.</p>
				)}
			</div>

			<div className="space-y-2 rounded-lg border border-dashed p-3">
				<p className="text-sm font-medium">Custom install</p>
				<p className="text-muted-foreground text-xs">
					Any model, no catalog edit. Spec:{" "}
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
					Install from spec
				</Button>
			</div>
		</div>
	)
}
