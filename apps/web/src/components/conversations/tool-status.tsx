import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StatusStyle, ToolRunStatus } from "@/types/conversations"

const PENDING_STYLE: StatusStyle = {
	variant: "outline",
	className: "border-amber-400/60 text-amber-600 dark:text-amber-400",
}
const MUTED_STYLE: StatusStyle = {
	variant: "outline",
	className: "text-muted-foreground",
}

const STATUS_STYLE: Record<ToolRunStatus, StatusStyle> = {
	dispatched: PENDING_STYLE,
	ok: { variant: "secondary", className: "text-success" },
	failed: { variant: "destructive", className: "" },
	timeout: PENDING_STYLE,
	cancelled: MUTED_STYLE,
	denied: MUTED_STYLE,
	lost: { variant: "destructive", className: "" },
}

const STATUS_LABEL: Record<ToolRunStatus, () => string> = {
	dispatched: m.conv_tool_status_dispatched,
	ok: m.conv_tool_status_ok,
	failed: m.conv_tool_status_failed,
	timeout: m.conv_tool_status_timeout,
	cancelled: m.conv_tool_status_cancelled,
	denied: m.conv_tool_status_denied,
	lost: m.conv_tool_status_lost,
}

const statusStyle = (status: string): StatusStyle =>
	(STATUS_STYLE as Partial<Record<string, StatusStyle>>)[status] ?? MUTED_STYLE

const statusLabel = (status: string): string =>
	(STATUS_LABEL as Partial<Record<string, () => string>>)[status]?.() ?? status

export function StatusChip({ status }: { status: string }) {
	const style = statusStyle(status)
	return (
		<Badge
			variant={style.variant}
			className={cn("text-[10px]", style.className)}
		>
			{statusLabel(status)}
		</Badge>
	)
}
