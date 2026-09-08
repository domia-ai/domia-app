import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Loader2, Plus, Radar, ServerCog } from "lucide-react"
import { toast } from "sonner"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Field, FieldLabel } from "@/components/ui/field"
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { probeNodeFn, addNodeFn } from "@/server/nodes"
import { isDemoMode } from "@/lib/demo"
import { DEFAULT_NODE_HTTP_PORT } from "@/constants/nodes"
import type { IdentityRole } from "@/types/nodes"

const ROLE_LABELS: Record<IdentityRole, () => string> = {
	principal: m.node_role_principal,
	hosted: m.node_role_hosted,
	peer: m.node_role_peer,
}

const parsePort = (raw: string): number | null => {
	const n = Number(raw)
	return Number.isInteger(n) && n > 0 && n <= 65535 ? n : null
}

export function AddNodeDialog() {
	const [open, setOpen] = useState(false)
	const [host, setHost] = useState("")
	const [portText, setPortText] = useState(String(DEFAULT_NODE_HTTP_PORT))
	const queryClient = useQueryClient()
	const navigate = useNavigate()
	const demo = isDemoMode()

	const port = parsePort(portText)
	const canProbe = host.trim() !== "" && port !== null

	const probe = useMutation({
		mutationFn: () => probeNodeFn({ data: { host: host.trim(), port: port! } }),
	})
	const add = useMutation({
		mutationFn: () => addNodeFn({ data: { host: host.trim(), port: port! } }),
	})

	const reset = () => {
		probe.reset()
		add.reset()
	}

	const onAdd = async () => {
		const result = await add.mutateAsync()
		if (result.ok && result.data) {
			toast.success(m.toast_node_added(), {
				description: m.toast_node_added_desc({
					count: result.data.identities.length,
				}),
			})
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ["nodes"] }),
				queryClient.invalidateQueries({ queryKey: ["fleet"] }),
				queryClient.invalidateQueries({ queryKey: ["fleet-graph"] }),
				queryClient.invalidateQueries({ queryKey: ["setup-candidates"] }),
			])
			setOpen(false)
			void navigate({
				to: "/domias/$key",
				params: { key: result.data.domiaKey },
			})
		} else {
			toast.error(m.toast_node_add_failed(), {
				description: errText(result.ok ? undefined : result.error),
			})
		}
	}

	const probed = probe.data?.ok ? probe.data.data : null
	const probeError = probe.isError
		? m.err_request_failed()
		: probe.data && !probe.data.ok
			? errText(probe.data.error)
			: null

	return (
		<Dialog
			open={open}
			onOpenChange={(next) => {
				setOpen(next)
				if (!next) reset()
			}}
		>
			<DialogTrigger
				render={
					<Button variant="outline" disabled={demo}>
						<Plus className="size-4" />
						{m.dlg_add_node_trigger()}
					</Button>
				}
			/>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{m.dlg_add_node_title()}</DialogTitle>
					<DialogDescription>{m.dlg_add_node_desc()}</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault()
						if (canProbe) probe.mutate()
					}}
					className="space-y-4"
				>
					<div className="grid grid-cols-[1fr_7rem] gap-3">
						<Field>
							<FieldLabel htmlFor="add-node-host">
								{m.dlg_add_node_host()}
							</FieldLabel>
							<Input
								id="add-node-host"
								value={host}
								onChange={(e) => {
									setHost(e.target.value)
									reset()
								}}
								placeholder={m.dlg_add_node_host_placeholder()}
								autoFocus
							/>
						</Field>
						<Field>
							<FieldLabel htmlFor="add-node-port">
								{m.dlg_add_node_port()}
							</FieldLabel>
							<Input
								id="add-node-port"
								type="number"
								value={portText}
								onChange={(e) => {
									setPortText(e.target.value)
									reset()
								}}
							/>
						</Field>
					</div>

					<div className="flex items-center gap-2">
						<Button
							type="submit"
							variant="outline"
							size="sm"
							disabled={!canProbe || probe.isPending}
						>
							{probe.isPending ? (
								<Loader2 className="size-4 animate-spin" />
							) : (
								<Radar className="size-4" />
							)}
							{probe.isPending
								? m.dlg_add_node_probing()
								: m.dlg_add_node_probe()}
						</Button>
						{probeError && (
							<span className="text-destructive text-xs">{probeError}</span>
						)}
					</div>

					{probed && (
						<div className="space-y-2 rounded-lg border px-3 py-2.5">
							<div className="flex items-center gap-2 text-sm">
								<ServerCog className="text-muted-foreground size-4" />
								<span className="font-mono text-xs">
									{probed.host}:{probed.port}
								</span>
								<Badge
									variant={
										probed.health.status === "ok" ? "default" : "outline"
									}
								>
									{probed.health.status}
								</Badge>
							</div>
							<p className="text-muted-foreground text-xs">
								{m.dlg_add_node_identities({
									count: probed.identities.length,
								})}
							</p>
							<div className="flex flex-wrap gap-1.5">
								{probed.identities.map((i) => (
									<Badge
										key={i.domiaKey}
										variant={i.isPrincipal ? "default" : "secondary"}
										title={i.domiaKey}
									>
										{i.name}
										<span className="ml-1 opacity-70">
											· {ROLE_LABELS[i.role]()}
										</span>
									</Badge>
								))}
							</div>
						</div>
					)}

					<DialogFooter>
						<DialogClose
							render={
								<Button type="button" variant="outline">
									{m.dlg_cancel()}
								</Button>
							}
						/>
						<Button
							type="button"
							disabled={!probed || add.isPending || demo}
							onClick={onAdd}
						>
							{add.isPending ? m.dlg_add_node_adding() : m.dlg_add_node_add()}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	)
}
