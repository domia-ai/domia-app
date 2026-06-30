import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import {
	AudioLines,
	Boxes,
	Brain,
	Ear,
	Fingerprint,
	Heart,
	Mic,
	Network,
	Package,
	RotateCcw,
	Search,
	SlidersHorizontal,
	Speaker,
	Stethoscope,
	ToggleRight,
	User,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ConfigSection } from "./config-section"
import { SaveTemplateDialog } from "./save-template-dialog"
import { useConfigDraft } from "@/hooks/use-config-draft"
import { importConfigFn } from "@/server/config"
import { CONFIG_SECTIONS, SECTION_GROUPS } from "@/constants/config"
import { cn } from "@/lib/utils"
import { summarizeApply } from "@/lib/config-apply"
import type { ConfigSnapshot } from "@/types/config"

const ICONS: Record<string, typeof User> = {
	identity: Fingerprint,
	user: User,
	heart: Heart,
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

export function ConfigWorkspace({
	domiaKey,
	domiaName,
	config,
	online,
	accent,
	mode = "live",
	onSaved,
	editTemplate,
	readOnly = false,
}: {
	domiaKey: string
	domiaName: string
	config: ConfigSnapshot
	online: boolean
	accent: string
	mode?: "live" | "template"
	onSaved?: () => void
	editTemplate?: { id: string; name: string; description: string }
	readOnly?: boolean
}) {
	const queryClient = useQueryClient()
	const router = useRouter()
	const draft = useConfigDraft(config)
	const [activeId, setActiveId] = useState(CONFIG_SECTIONS[0].id)
	const [search, setSearch] = useState("")

	const isTemplate = mode === "template"
	const snapshotConfig = draft.mergeInto(config)
	const sections = domiaKey
		? CONFIG_SECTIONS
		: CONFIG_SECTIONS.filter(
				(s) => s.kind !== "diagnostics" && s.kind !== "models",
			)

	const active =
		CONFIG_SECTIONS.find((s) => s.id === activeId) ?? CONFIG_SECTIONS[0]
	const changedBySection = new Map(
		draft.impact.sections.map((s) => [s.section, s.changed.length]),
	)

	const importMutation = useMutation({
		mutationFn: (bundle: Record<string, unknown>) =>
			importConfigFn({ data: { domiaKey, bundle } }),
	})

	const onApply = async () => {
		const bundle = draft.buildBundle()
		const result = await importMutation.mutateAsync(bundle)
		if (result.ok && result.data) {
			draft.commit()
			queryClient.invalidateQueries({ queryKey: ["fleet"] })
			queryClient.invalidateQueries({ queryKey: ["config", domiaKey] })
			void router.invalidate()
			const apply = result.data.apply
			const description = apply
				? summarizeApply(apply)
				: `${domiaName} applied the change.`
			if (apply && (apply.result === "partial" || apply.result === "restart")) {
				toast.warning("Configuration saved", { description })
			} else {
				toast.success("Configuration saved", { description })
			}
		} else {
			toast.error("Could not save", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	}

	const dirty = draft.impact.totalChanged > 0

	return (
		<div className="flex min-h-0 flex-col">
			<div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
				<nav className="space-y-4 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto lg:pr-1">
					<div className="bg-background sticky top-0 z-10 pb-1">
						<Search className="text-muted-foreground absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
						<Input
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search settings…"
							className="h-9 pl-8"
						/>
					</div>
					{SECTION_GROUPS.filter((group) =>
						sections.some((s) => s.group === group),
					).map((group) => (
						<div key={group} className="space-y-1">
							<p className="text-muted-foreground px-2 text-[11px] font-medium tracking-wide uppercase">
								{group}
							</p>
							{sections
								.filter((s) => s.group === group)
								.map((section) => {
									const Icon = ICONS[section.icon] ?? SlidersHorizontal
									const count = changedBySection.get(section.id) ?? 0
									return (
										<button
											key={section.id}
											type="button"
											onClick={() => setActiveId(section.id)}
											className={cn(
												"flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
												section.id === activeId
													? "bg-muted font-medium"
													: "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
											)}
										>
											<Icon className="size-4 shrink-0" />
											<span className="flex-1 text-left">{section.label}</span>
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
							accent={accent}
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
									? `${draft.impact.totalChanged} edits from the starting Domia`
									: "Editing a copy — nothing is applied to a live Domia"}
							</span>
							{!draft.isValid && (
								<span className="text-destructive">
									{" "}
									· fix invalid fields to save
								</span>
							)}
						</span>
						<div className="ml-auto flex items-center gap-2">
							{dirty && (
								<Button variant="ghost" onClick={draft.reset}>
									<RotateCcw className="size-4" />
									Reset
								</Button>
							)}
							<SaveTemplateDialog
								config={snapshotConfig}
								onSaved={onSaved}
								variant="default"
								label={editTemplate ? "Save changes" : "Save template"}
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
									{draft.impact.totalChanged} unsaved
								</span>
								<span className="text-muted-foreground">
									· applying restarts {domiaName}
								</span>
								{!draft.isValid && (
									<span className="text-destructive">
										· fix invalid fields to save
									</span>
								)}
							</span>
							<div className="ml-auto flex items-center gap-2">
								<Button variant="ghost" onClick={draft.reset}>
									<RotateCcw className="size-4" />
									Reset
								</Button>
								<Button
									disabled={importMutation.isPending || !draft.isValid}
									onClick={onApply}
								>
									{importMutation.isPending ? "Saving…" : "Save & restart"}
								</Button>
							</div>
						</div>
					</div>
				)
			)}
		</div>
	)
}
