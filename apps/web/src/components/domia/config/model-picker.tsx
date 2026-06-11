import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { Download, Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
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
import type { ModelCatalogEntry } from "@/types/config"

const MAX_POLL_FAILURES = 5
const POLL_MS = 1500

const kindsForStage = (stage: string): Set<string> =>
	stage === "llm" ? new Set(["ollama"]) : new Set(["dir", "file"])

const specFromCatalog = (entry: ModelCatalogEntry): Record<string, unknown> => {
	const spec: Record<string, unknown> = { kind: entry.kind }
	if (entry.url) spec.url = entry.url
	if (entry.target) spec.target = entry.target
	if (entry.sourceDir) spec.sourceDir = entry.sourceDir
	if (entry.model) spec.model = entry.model
	return spec
}

const catalogValue = (entry: ModelCatalogEntry): string =>
	entry.target ?? entry.model ?? entry.label ?? entry.kind

export function ModelPicker({
	domiaKey,
	stage,
	value,
	onChange,
}: {
	domiaKey: string
	stage: string
	value: string
	onChange: (v: string) => void
}) {
	const queryClient = useQueryClient()
	const [installing, setInstalling] = useState<string | null>(null)
	const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	useEffect(
		() => () => {
			if (pollTimer.current) clearTimeout(pollTimer.current)
		},
		[],
	)
	const [open, setOpen] = useState(false)

	const query = useQuery({
		...modelsQueryOptions(domiaKey),
		enabled: !!domiaKey,
	})
	const installMutation = useMutation({
		mutationFn: (spec: Record<string, unknown>) =>
			installModelFn({ data: { domiaKey, spec } }),
	})

	if (!domiaKey)
		return (
			<Input
				value={value}
				onChange={(e) => onChange(e.target.value)}
				placeholder="Model path or name…"
			/>
		)

	const report = query.data?.ok ? query.data.data : null
	const kinds = kindsForStage(stage)
	const installed = (report?.installed ?? []).filter((m) => kinds.has(m.kind))
	const installedNames = new Set(installed.map((m) => m.name))
	const catalog = (report?.catalog ?? []).filter(
		(c) => !c.stage || c.stage === stage,
	)
	const options =
		value && !installedNames.has(value)
			? [value, ...installed.map((m) => m.name)]
			: installed.map((m) => m.name)

	const pollJob = (jobId: string, label: string) => {
		let failures = 0
		const schedule = () => {
			pollTimer.current = setTimeout(() => void tick(), POLL_MS)
		}
		const tick = async () => {
			const res = await getModelJobFn({ data: { domiaKey, jobId } })
			if (!res.ok || !res.data) {
				failures++
				if (failures <= MAX_POLL_FAILURES) {
					schedule()
					return
				}
				setInstalling(null)
				toast.error("Install status unavailable", {
					description: "Lost contact with the node — check it directly.",
				})
				return
			}
			failures = 0
			if (res.data.status === "running") {
				schedule()
				return
			}
			setInstalling(null)
			if (res.data.status === "done") {
				toast.success(`Installed ${label}`)
				queryClient.invalidateQueries({ queryKey: ["models", domiaKey] })
			} else {
				toast.error("Install failed", { description: res.data.detail })
			}
		}
		schedule()
	}

	const onInstall = async (entry: ModelCatalogEntry) => {
		const label = catalogValue(entry)
		setInstalling(label)
		const result = await installMutation.mutateAsync(specFromCatalog(entry))
		if (result.ok && result.data) {
			toast.info(`Installing ${label}…`)
			if (entry.target) onChange(entry.target)
			pollJob(result.data.id, label)
			setOpen(false)
		} else {
			setInstalling(null)
			toast.error("Could not start install", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	}

	return (
		<div className="flex items-center gap-2">
			<Select value={value} onValueChange={(v) => v && onChange(v)}>
				<SelectTrigger className="h-9 flex-1">
					<SelectValue placeholder="Choose a model…" />
				</SelectTrigger>
				<SelectContent>
					{query.isLoading ? (
						<div className="text-muted-foreground flex items-center gap-2 px-2 py-1.5 text-xs">
							<Loader2 className="size-3.5 animate-spin" />
							Loading models…
						</div>
					) : query.isError || (query.data && !query.data.ok) ? (
						<div className="text-destructive px-2 py-1.5 text-xs">
							Couldn't load installed models
						</div>
					) : options.length ? (
						options.map((name) => (
							<SelectItem key={name} value={name}>
								{name}
							</SelectItem>
						))
					) : (
						<div className="text-muted-foreground px-2 py-1.5 text-xs">
							None installed
						</div>
					)}
				</SelectContent>
			</Select>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					render={
						<Button
							type="button"
							variant="outline"
							size="icon"
							className="size-9 shrink-0"
						>
							{installing ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Plus className="size-4" />
							)}
						</Button>
					}
				/>
				<PopoverContent align="end" className="w-72 p-2">
					<p className="text-muted-foreground px-1 pb-1.5 text-xs">
						Install a {stage} model
					</p>
					<div className="space-y-1">
						{catalog.length ? (
							catalog.map((entry) => {
								const label = catalogValue(entry)
								const done = entry.target
									? installedNames.has(entry.target)
									: false
								return (
									<div
										key={label}
										className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1"
									>
										<span className="truncate text-sm">
											{entry.label ?? label}
										</span>
										{done ? (
											<span className="text-muted-foreground text-[11px]">
												Installed
											</span>
										) : (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={!!installing}
												onClick={() => onInstall(entry)}
											>
												<Download className="size-3.5" />
											</Button>
										)}
									</div>
								)
							})
						) : (
							<p className="text-muted-foreground px-1.5 py-1 text-xs">
								No catalog entries for this stage.
							</p>
						)}
					</div>
				</PopoverContent>
			</Popover>
		</div>
	)
}
