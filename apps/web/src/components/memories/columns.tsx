import type { ColumnDef } from "@tanstack/react-table"
import { Link } from "@tanstack/react-router"
import { ExternalLink } from "lucide-react"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { relativeTime } from "@/utils/format"
import { ConfidenceBar } from "./confidence-bar"
import type { MemoryFactRow } from "@/types/memories"

export const memoryColumns: ColumnDef<MemoryFactRow>[] = [
	{
		id: "domia",
		header: "Domia",
		enableSorting: false,
		cell: ({ row }) => {
			const r = row.original
			const name = r.domiaName ?? r.sourceDomiaKey
			return (
				<Link
					to="/domias/$key"
					params={{ key: r.sourceDomiaKey }}
					onClick={(e) => e.stopPropagation()}
					className="flex items-center gap-2.5 hover:underline"
				>
					<PersonaAvatar
						domiaKey={r.sourceDomiaKey}
						name={name}
						avatarId={r.domiaAvatarId}
						size="sm"
					/>
					<span className="font-medium">{name}</span>
				</Link>
			)
		},
	},
	{
		id: "fact",
		header: "Fact",
		enableSorting: false,
		cell: ({ row }) => {
			const r = row.original
			return (
				<span className="text-sm">
					<span className="text-muted-foreground">{r.subject}</span>{" "}
					<span className="text-muted-foreground">{r.relation}</span>{" "}
					<span className="font-medium">{r.value}</span>
				</span>
			)
		},
	},
	{
		id: "confidence",
		header: "Confidence",
		cell: ({ row }) => <ConfidenceBar value={row.original.confidence ?? 0} />,
	},
	{
		id: "source",
		header: "Source",
		enableSorting: false,
		cell: ({ row }) =>
			row.original.sourceInteractionId ? (
				<Link
					to="/conversations/$id"
					params={{ id: row.original.sourceInteractionId }}
					onClick={(e) => e.stopPropagation()}
					className="text-primary inline-flex items-center gap-1 text-xs hover:underline"
				>
					trace <ExternalLink className="size-3" />
				</Link>
			) : (
				<span className="text-muted-foreground text-xs">—</span>
			),
	},
	{
		id: "updatedAt",
		header: "Learned",
		cell: ({ row }) => (
			<span className="text-muted-foreground">
				{relativeTime(row.original.updatedAt)}
			</span>
		),
	},
]
