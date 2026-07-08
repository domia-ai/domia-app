import { useTransition } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQueryClient } from "@tanstack/react-query"
import {
	Copy,
	ExternalLink,
	Layers,
	MoreHorizontal,
	ThumbsDown,
	ThumbsUp,
} from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { gradeInteraction } from "@/server/grading"
import type { RowActionsProps } from "@/types/conversations"

export function RowActions({ row }: RowActionsProps) {
	const navigate = useNavigate()
	const queryClient = useQueryClient()
	const [pending, start] = useTransition()

	const quickGrade = (rating: "up" | "down") =>
		start(async () => {
			const result = await gradeInteraction({
				data: {
					interactionId: row.id,
					rating,
					correction: row.correction,
					tags: row.tags,
				},
			})
			if (result.ok) {
				toast.success(
					rating === "up" ? m.toast_graded_good() : m.toast_graded_needs_work(),
				)
				queryClient.invalidateQueries({ queryKey: ["conversations"] })
				queryClient.invalidateQueries({ queryKey: ["conversation-stats"] })
			} else {
				toast.error(errText(result.error))
			}
		})

	const copy = (text: string | null, label: string) => {
		if (!text) return
		void navigator.clipboard.writeText(text)
		toast.success(m.toast_copied({ label }))
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				onClick={(e) => e.stopPropagation()}
				className="text-muted-foreground hover:bg-muted hover:text-foreground flex size-7 items-center justify-center rounded-md outline-none"
				aria-label={m.conv_row_actions()}
			>
				<MoreHorizontal className="size-4" />
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
				<DropdownMenuItem
					onClick={() =>
						navigate({ to: "/conversations/$id", params: { id: row.id } })
					}
				>
					<ExternalLink className="size-3.5" />
					{m.conv_open()}
				</DropdownMenuItem>
				{row.interactionSessionTraceId && (
					<DropdownMenuItem
						onClick={() =>
							navigate({
								to: "/conversations/session/$id",
								params: { id: row.interactionSessionTraceId! },
							})
						}
					>
						<Layers className="size-3.5" />
						{m.conv_open_session()}
					</DropdownMenuItem>
				)}
				<DropdownMenuSeparator />
				<DropdownMenuItem disabled={pending} onClick={() => quickGrade("up")}>
					<ThumbsUp className="size-3.5" />
					{m.conv_grade_good()}
				</DropdownMenuItem>
				<DropdownMenuItem disabled={pending} onClick={() => quickGrade("down")}>
					<ThumbsDown className="size-3.5" />
					{m.conv_grade_needs_work()}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => copy(row.id, "ID")}>
					<Copy className="size-3.5" />
					{m.conv_copy_id()}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() =>
						copy(row.sttResult ?? row.inputRaw, m.conv_label_transcript())
					}
				>
					<Copy className="size-3.5" />
					{m.conv_copy_transcript()}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
