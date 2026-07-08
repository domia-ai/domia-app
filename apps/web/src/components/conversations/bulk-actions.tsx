import { useState } from "react"
import { Download, ThumbsDown, ThumbsUp, X } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Button } from "@/components/ui/button"
import { bulkGradeInteractions } from "@/server/grading"
import type { BulkActionsProps } from "@/types/conversations"

export function BulkActions({ rows, onClear, onGraded }: BulkActionsProps) {
	const [grading, setGrading] = useState<"up" | "down" | null>(null)

	const grade = async (rating: "up" | "down") => {
		setGrading(rating)
		const res = await bulkGradeInteractions({
			data: {
				ids: rows.map((r) => r.id),
				rating,
			},
		})
		setGrading(null)
		if (!res.ok) {
			toast.error(errText(res.error ?? undefined))
			return
		}
		toast.success(
			rating === "up"
				? m.toast_graded_bulk_good({ count: rows.length })
				: m.toast_graded_bulk_needs_work({ count: rows.length }),
		)
		onGraded()
	}

	const exportJsonl = () => {
		const lines = rows.map((r) =>
			JSON.stringify({
				input: r.sttResult ?? r.inputRaw,
				response: r.llmResponse,
				rating: r.rating,
				correction: r.correction,
				tags: r.tags,
			}),
		)
		const blob = new Blob([lines.join("\n")], {
			type: "application/x-ndjson",
		})
		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = "conversations.jsonl"
		a.click()
		URL.revokeObjectURL(url)
		toast.success(m.toast_exported_rows({ count: rows.length }))
	}

	return (
		<div className="bg-muted/40 flex items-center gap-3 rounded-lg border px-3 py-2 text-sm">
			<span className="font-medium">
				{m.conv_selected_count({ count: rows.length })}
			</span>
			<Button
				variant="outline"
				size="sm"
				className="h-7"
				disabled={grading !== null}
				onClick={() => grade("up")}
			>
				<ThumbsUp className="size-3.5" />
				{m.conv_rating_good()}
			</Button>
			<Button
				variant="outline"
				size="sm"
				className="h-7"
				disabled={grading !== null}
				onClick={() => grade("down")}
			>
				<ThumbsDown className="size-3.5" />
				{m.conv_rating_needs_work()}
			</Button>
			<Button variant="outline" size="sm" className="h-7" onClick={exportJsonl}>
				<Download className="size-3.5" />
				{m.conv_export_selected()}
			</Button>
			<button
				type="button"
				onClick={onClear}
				className="text-muted-foreground hover:text-foreground ml-auto"
				aria-label={m.conv_clear_selection()}
			>
				<X className="size-4" />
			</button>
		</div>
	)
}
