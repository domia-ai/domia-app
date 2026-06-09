import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { AlertTriangle, Loader2, SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { MindEditor } from "./mind-editor"
import { mindEditorQueryOptions } from "@/server/mind"
import type { ConfigDialogProps } from "@/types"

export function ConfigDialog({
	domiaKey,
	domiaName,
	online,
}: ConfigDialogProps) {
	const [open, setOpen] = useState(false)

	const editorQuery = useQuery({
		...mindEditorQueryOptions(domiaKey),
		enabled: open && online,
	})

	const result = editorQuery.data
	const loading = editorQuery.isLoading
	const failed = editorQuery.isError
		? "request failed"
		: result && !result.ok
			? result.error
			: null

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger
				render={
					<Button variant="outline" disabled={!online}>
						<SlidersHorizontal className="size-4" />
						Configure
					</Button>
				}
			/>
			<DialogContent className="flex max-h-[88vh] flex-col gap-4 sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Configure {domiaName}</DialogTitle>
					<DialogDescription className="flex items-center gap-1.5">
						<AlertTriangle className="text-warning size-3.5" />
						Changes apply to the live Domia from its next interaction.
					</DialogDescription>
				</DialogHeader>

				{!online ? (
					<p className="text-muted-foreground py-8 text-center text-sm">
						This Domia is offline. Bring it online to edit its configuration.
					</p>
				) : loading ? (
					<div className="text-muted-foreground flex items-center justify-center gap-2 py-12 text-sm">
						<Loader2 className="size-4 animate-spin" />
						Loading live configuration…
					</div>
				) : failed ? (
					<p className="text-destructive py-8 text-center text-sm">
						Could not load configuration: {failed}
					</p>
				) : result?.ok && result.data ? (
					<MindEditor
						domiaKey={domiaKey}
						mind={result.data.mind}
						templates={result.data.templates}
						onClose={() => setOpen(false)}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	)
}
