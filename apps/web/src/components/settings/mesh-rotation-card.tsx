import { useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { KeyRound, RefreshCw, ShieldCheck, ShieldAlert } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { AsyncBoundary } from "@/components/ui/async-boundary"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import { useActionMutation } from "@/hooks/use-action-mutation"
import { useActionQuery, useDataQuery } from "@/hooks/use-query-state"
import { meshPostureQueryOptions, meshRotateFn } from "@/server/mesh"
import { nodesQueryOptions } from "@/server/nodes"
import { isDemoMode } from "@/lib/demo"
import { formatMs } from "@/utils/format"
import { MESH_ROTATE_FORBIDDEN } from "@/utils/service-errors"
import type { MeshRotateAction, MeshRotateResult } from "@/types/mesh-admin"
import type { NodeSummary } from "@/types/nodes"

const anchorOf = (node: NodeSummary): string =>
	node.identities.find((i) => i.isPrincipal)?.domiaKey ??
	node.identities[0]?.domiaKey ??
	""

const isForbidden = (error: string | null | undefined): boolean =>
	error === MESH_ROTATE_FORBIDDEN

function Posture({ posture }: { posture: MeshRotateResult }) {
	return (
		<div className="space-y-3">
			<div className="flex flex-wrap items-center gap-2">
				{posture.rotating ? (
					<Badge className="gap-1.5 bg-[var(--warning)]/15 text-[var(--warning)]">
						<ShieldAlert className="size-3.5" />
						{m.mesh_rotate_state_rotating()}
					</Badge>
				) : (
					<Badge variant="secondary" className="gap-1.5">
						<ShieldCheck className="size-3.5" />
						{m.mesh_rotate_state_stable()}
					</Badge>
				)}
				<Badge variant="outline" className="font-mono text-[11px]">
					{m.mesh_rotate_signing({ slot: posture.signingWith })}
				</Badge>
				<Badge variant="outline" className="font-mono text-[11px]">
					{m.mesh_rotate_accepted({ slots: posture.accepted.join(", ") })}
				</Badge>
			</div>

			<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
				<dt className="text-muted-foreground">{m.mesh_rotate_grace()}</dt>
				<dd className="text-right font-medium tabular-nums">
					{formatMs(posture.graceMs)}
				</dd>
				<dt className="text-muted-foreground">{m.mesh_rotate_grace_ends()}</dt>
				<dd className="text-right font-medium">
					{posture.graceEndsAt
						? new Date(posture.graceEndsAt).toLocaleString()
						: "—"}
				</dd>
				<dt className="text-muted-foreground">
					{m.mesh_rotate_fingerprint_current()}
				</dt>
				<dd className="text-right font-mono text-xs">
					{posture.fingerprints.current ?? "—"}
				</dd>
				<dt className="text-muted-foreground">
					{m.mesh_rotate_fingerprint_next()}
				</dt>
				<dd className="text-right font-mono text-xs">
					{posture.fingerprints.next ?? "—"}
				</dd>
			</dl>
		</div>
	)
}

export function MeshRotationCard() {
	const demo = isDemoMode()
	const queryClient = useQueryClient()
	const [selected, setSelected] = useState("")

	const { state: nodesState } = useDataQuery<NodeSummary[], string[]>({
		...nodesQueryOptions(),
		errorMessage: m.mesh_rotate_nodes_error,
	})
	const nodes = nodesState.status === "ready" ? nodesState.data : []
	const activeNodeId = selected || nodes[0]?.nodeId || ""
	const activeNode = nodes.find((n) => n.nodeId === activeNodeId) ?? nodes[0]
	const anchor = activeNode ? anchorOf(activeNode) : ""

	const { state: postureState, query } = useActionQuery<
		MeshRotateResult,
		string[]
	>({
		...meshPostureQueryOptions(anchor),
		errorMessage: m.mesh_rotate_status_error,
	})

	const mutation = useActionMutation({
		mutationFn: (action: MeshRotateAction) =>
			meshRotateFn({ data: { domiaKey: anchor, action } }),
		failureTitle: m.mesh_rotate_failed,
		onDone: (data) => {
			if (!data) return
			toast.success(m.mesh_rotate_done({ action: data.action }))
			void queryClient.invalidateQueries({
				queryKey: ["mesh-posture", anchor],
			})
		},
	})

	const lastResult = mutation.data
	const forbidden =
		lastResult && !lastResult.ok && isForbidden(lastResult.error)

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
				<CardTitle className="flex items-center gap-2">
					<KeyRound className="size-4" />
					{m.mesh_rotate_title()}
				</CardTitle>
				{nodes.length > 1 && (
					<Select
						value={activeNodeId}
						onValueChange={(value) => value && setSelected(value)}
						items={nodes.map((n) => ({
							value: n.nodeId,
							label: n.principalName ?? n.nodeId,
						}))}
					>
						<SelectTrigger className="h-9 w-48">
							<SelectValue />
						</SelectTrigger>
						<SelectContent>
							{nodes.map((n) => (
								<SelectItem key={n.nodeId} value={n.nodeId}>
									{n.principalName ?? n.nodeId}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				)}
			</CardHeader>
			<CardContent className="space-y-4">
				<p className="text-muted-foreground text-sm">{m.mesh_rotate_help()}</p>

				{anchor === "" ? (
					<p className="text-muted-foreground text-sm">
						{m.settings_no_domias()}
					</p>
				) : (
					<AsyncBoundary
						state={postureState}
						skeleton={<Skeleton className="h-32 w-full" />}
					>
						{(posture) => (posture ? <Posture posture={posture} /> : null)}
					</AsyncBoundary>
				)}

				<p className="text-muted-foreground rounded-lg border border-dashed px-3 py-2 text-xs">
					{m.mesh_rotate_403_hint()}
				</p>

				{forbidden && (
					<p className="text-destructive text-xs">{m.mesh_rotate_403_seen()}</p>
				)}

				<div className="flex flex-wrap gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!anchor || query.isFetching}
						onClick={() => void query.refetch()}
					>
						<RefreshCw className="size-4" />
						{m.mesh_rotate_refresh()}
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={demo || !anchor || mutation.isPending}
						onClick={() => mutation.mutate("restart-grace")}
					>
						{m.mesh_rotate_restart()}
					</Button>
					<Button
						variant="outline"
						size="sm"
						disabled={demo || !anchor || mutation.isPending}
						onClick={() => mutation.mutate("end-grace")}
					>
						{m.mesh_rotate_end()}
					</Button>
				</div>
			</CardContent>
		</Card>
	)
}
