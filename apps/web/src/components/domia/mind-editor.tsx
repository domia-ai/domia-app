import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useRouter } from "@tanstack/react-router"
import { Check, Copy, Download, Save, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useMindForm, MindFormFields } from "./mind-form"
import { importMindFn } from "@/server/mind"
import { applyTemplateFn, createTemplateFn } from "@/server/templates"
import { mindSchema } from "@/schemas/mind"
import type { MindEditorProps, MindSnapshot } from "@/types"

export function MindEditor({
	domiaKey,
	mind,
	templates,
	onClose,
}: MindEditorProps) {
	const queryClient = useQueryClient()
	const router = useRouter()
	const [jsonDraft, setJsonDraft] = useState(() =>
		JSON.stringify(mind, null, 2),
	)
	const [copied, setCopied] = useState(false)
	const [templateName, setTemplateName] = useState("")

	const refreshAfterWrite = () => {
		queryClient.invalidateQueries({ queryKey: ["mind-editor", domiaKey] })
		queryClient.invalidateQueries({ queryKey: ["fleet"] })
		void router.invalidate()
	}

	const importMutation = useMutation({
		mutationFn: (value: MindSnapshot) =>
			importMindFn({ data: { domiaKey, mind: value } }),
	})

	const applyMutation = useMutation({
		mutationFn: (templateId: string) =>
			applyTemplateFn({ data: { templateId, domiaKey } }),
	})

	const saveTemplateMutation = useMutation({
		mutationFn: (input: { name: string; mind: MindSnapshot }) =>
			createTemplateFn({
				data: { name: input.name, description: "", mind: input.mind },
			}),
	})

	const form = useMindForm(mind, async (value) => {
		const result = await importMutation.mutateAsync(value)
		if (result.ok && result.data) {
			toast.success("Configuration applied", {
				description: "The Domia uses it from the next interaction.",
			})
			refreshAfterWrite()
			onClose()
		} else {
			toast.error("Could not apply", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	})

	const onApply = async (templateId: string, name: string) => {
		const result = await applyMutation.mutateAsync(templateId)
		if (result.ok && result.data) {
			toast.success(`Applied "${name}"`, {
				description: "Persona, mood and modules swapped live.",
			})
			refreshAfterWrite()
			onClose()
		} else {
			toast.error("Could not apply", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	}

	const onSaveAsTemplate = async () => {
		const name = templateName.trim()
		if (!name) return
		const result = await saveTemplateMutation.mutateAsync({
			name,
			mind: form.state.values as MindSnapshot,
		})
		if (result.ok && result.data) {
			toast.success(`Saved template "${name}"`)
			setTemplateName("")
			queryClient.invalidateQueries({ queryKey: ["mind-editor", domiaKey] })
			queryClient.invalidateQueries({ queryKey: ["templates"] })
		} else {
			toast.error("Could not save template", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	}

	const onImportJson = async () => {
		let parsed: unknown
		try {
			parsed = JSON.parse(jsonDraft)
		} catch {
			toast.error("Invalid JSON", { description: "Could not parse the text." })
			return
		}
		const validated = mindSchema.safeParse(parsed)
		if (!validated.success) {
			toast.error("Invalid mind bundle", {
				description: validated.error.issues[0]?.message ?? "Shape mismatch.",
			})
			return
		}
		const result = await importMutation.mutateAsync(validated.data)
		if (result.ok && result.data) {
			toast.success("Mind imported")
			refreshAfterWrite()
			onClose()
		} else {
			toast.error("Could not import", {
				description: result.ok ? "Empty response" : result.error,
			})
		}
	}

	const onCopy = async () => {
		await navigator.clipboard.writeText(jsonDraft)
		setCopied(true)
		setTimeout(() => setCopied(false), 1500)
	}

	const onDownload = () => {
		const blob = new Blob([jsonDraft], { type: "application/json" })
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `mind-${domiaKey}.json`
		a.click()
		URL.revokeObjectURL(url)
	}

	return (
		<div className="flex min-h-0 flex-col gap-4">
			<Tabs defaultValue="persona" className="flex min-h-0 flex-col">
				<TabsList className="w-full justify-start overflow-x-auto">
					<TabsTrigger value="persona">Persona</TabsTrigger>
					<TabsTrigger value="emotion">Mood</TabsTrigger>
					<TabsTrigger value="modules">Modules</TabsTrigger>
					<TabsTrigger value="templates">Templates</TabsTrigger>
					<TabsTrigger value="json">JSON</TabsTrigger>
				</TabsList>

				<div className="max-h-[55vh] min-h-0 overflow-y-auto pt-4 pr-1">
					<MindFormFields form={form} />

					<TabsContent value="templates" className="mt-0 space-y-4">
						<div className="space-y-2 rounded-lg border border-dashed p-3">
							<p className="text-sm font-medium">Save current as template</p>
							<p className="text-muted-foreground text-xs">
								Stores this persona, mood and modules for reuse on any Domia.
							</p>
							<div className="flex items-center gap-2">
								<Input
									value={templateName}
									onChange={(e) => setTemplateName(e.target.value)}
									placeholder="Template name"
									className="h-8"
								/>
								<Button
									type="button"
									variant="secondary"
									size="sm"
									disabled={
										!templateName.trim() || saveTemplateMutation.isPending
									}
									onClick={onSaveAsTemplate}
								>
									<Save className="size-4" />
									Save
								</Button>
							</div>
						</div>

						{templates.length ? (
							<div className="space-y-2">
								{templates.map((tpl) => (
									<div
										key={tpl.id}
										className="flex items-center justify-between gap-4 rounded-lg border px-3 py-2.5"
									>
										<div className="space-y-0.5">
											<p className="text-sm font-medium">{tpl.name}</p>
											<p className="text-muted-foreground text-xs">
												{tpl.description}
											</p>
										</div>
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={applyMutation.isPending}
											onClick={() => onApply(tpl.id, tpl.name)}
										>
											<Sparkles className="size-4" />
											Apply
										</Button>
									</div>
								))}
							</div>
						) : (
							<p className="text-muted-foreground text-sm">No templates yet.</p>
						)}
					</TabsContent>

					<TabsContent value="json" className="mt-0 space-y-3">
						<div className="flex items-center gap-2">
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onCopy}
							>
								{copied ? (
									<Check className="size-4" />
								) : (
									<Copy className="size-4" />
								)}
								Copy
							</Button>
							<Button
								type="button"
								variant="outline"
								size="sm"
								onClick={onDownload}
							>
								<Download className="size-4" />
								Download
							</Button>
						</div>
						<Textarea
							value={jsonDraft}
							onChange={(e) => setJsonDraft(e.target.value)}
							rows={16}
							className="font-mono text-xs"
							spellCheck={false}
						/>
						<Button
							type="button"
							variant="secondary"
							className="w-full"
							disabled={importMutation.isPending}
							onClick={onImportJson}
						>
							Import this JSON
						</Button>
					</TabsContent>
				</div>
			</Tabs>

			<div className="flex items-center justify-end gap-2 border-t pt-4">
				<Button type="button" variant="ghost" onClick={onClose}>
					Cancel
				</Button>
				<form.Subscribe selector={(s) => [s.isSubmitting, s.canSubmit]}>
					{([isSubmitting, canSubmit]) => (
						<Button
							type="button"
							onClick={() => void form.handleSubmit()}
							disabled={!canSubmit || isSubmitting}
						>
							{isSubmitting ? "Applying…" : "Apply changes"}
						</Button>
					)}
				</form.Subscribe>
			</div>
		</div>
	)
}
