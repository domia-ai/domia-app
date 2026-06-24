import { Plus, Trash2, Server, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import type { ConfigDraftApi } from "@/hooks/use-config-draft"
import type { SkillProviderDraft } from "@/types/config"

const SKILL_PROTOCOLS: {
	value: SkillProviderDraft["protocol"]
	label: string
	available: boolean
}[] = [
	{ value: "mcp", label: "MCP", available: true },
	{ value: "http", label: "HTTP (soon)", available: false },
	{ value: "mqtt", label: "MQTT (soon)", available: false },
]

const EMPTY_SERVER: SkillProviderDraft = {
	id: "",
	name: "",
	protocol: "mcp",
	type: "http",
	url: "",
	authKind: "bearer",
	token: "",
	headers: "",
	whitelist: [],
	config: "",
}

function Field({
	label,
	hint,
	children,
}: {
	label: string
	hint?: string
	children: React.ReactNode
}) {
	return (
		<div className="space-y-1.5">
			<Label className="text-xs">{label}</Label>
			{children}
			{hint && <p className="text-muted-foreground text-[11px]">{hint}</p>}
		</div>
	)
}

export function ConfigSkillProviders({ draft }: { draft: ConfigDraftApi }) {
	const servers = draft.skillProviders

	const update = (index: number, patch: Partial<SkillProviderDraft>) =>
		draft.setSkillProviders(
			servers.map((s, i) => (i === index ? { ...s, ...patch } : s)),
		)

	const add = () => draft.setSkillProviders([...servers, { ...EMPTY_SERVER }])
	const remove = (index: number) =>
		draft.setSkillProviders(servers.filter((_, i) => i !== index))

	return (
		<div className="space-y-3">
			{servers.length === 0 && (
				<div className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
					<Server className="mx-auto mb-2 size-5 opacity-60" />
					No skill providers yet. Add one to give this Domia tools — Home
					Assistant, a calendar, a filesystem, or any MCP server.
				</div>
			)}

			{servers.map((server, index) => (
				<Card key={index} className="space-y-3 p-4">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate text-sm font-medium">
							{server.name.trim() || "New provider"}
						</span>
						<Button
							type="button"
							variant="ghost"
							size="sm"
							className="text-muted-foreground hover:text-destructive -my-1 h-7 px-2"
							onClick={() => remove(index)}
						>
							<Trash2 className="size-3.5" />
						</Button>
					</div>

					<div className="grid gap-3 sm:grid-cols-[1fr_8rem_9rem]">
						<Field label="Name">
							<Input
								value={server.name}
								onChange={(e) => update(index, { name: e.target.value })}
								placeholder="home-assistant"
							/>
						</Field>
						<Field label="Protocol">
							<Select
								value={server.protocol}
								onValueChange={(v) =>
									update(index, {
										protocol: v as SkillProviderDraft["protocol"],
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{SKILL_PROTOCOLS.map((p) => (
										<SelectItem
											key={p.value}
											value={p.value}
											disabled={!p.available}
										>
											{p.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</Field>
						{server.protocol === "mcp" && (
							<Field label="Transport">
								<Select
									value={server.type}
									onValueChange={(v) =>
										update(index, { type: v === "sse" ? "sse" : "http" })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="http">Streamable HTTP</SelectItem>
										<SelectItem value="sse">SSE</SelectItem>
									</SelectContent>
								</Select>
							</Field>
						)}
					</div>

					<Field label="Endpoint URL">
						<Input
							value={server.url}
							onChange={(e) => update(index, { url: e.target.value })}
							placeholder="https://homeassistant.local:8123/mcp_server/sse"
						/>
					</Field>

					<div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
						<Field label="Auth">
							<Select
								value={server.authKind}
								onValueChange={(v) =>
									update(index, {
										authKind: v as SkillProviderDraft["authKind"],
									})
								}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">None</SelectItem>
									<SelectItem value="bearer">Bearer token</SelectItem>
									<SelectItem value="headers">Custom headers</SelectItem>
								</SelectContent>
							</Select>
						</Field>
						{server.authKind === "bearer" && (
							<Field
								label="Token"
								hint="Write-only — leave blank to keep the current one."
							>
								<Input
									type="password"
									value={server.token}
									onChange={(e) => update(index, { token: e.target.value })}
									placeholder="leave blank to keep current"
									autoComplete="off"
								/>
							</Field>
						)}
						{server.authKind === "headers" && (
							<Field
								label="Headers (JSON)"
								hint="Write-only — leave blank to keep current."
							>
								<Textarea
									value={server.headers}
									onChange={(e) => update(index, { headers: e.target.value })}
									placeholder={'{ "X-API-Key": "…" }'}
									rows={2}
									className="font-mono text-xs"
									spellCheck={false}
									autoComplete="off"
								/>
							</Field>
						)}
					</div>

					<Field
						label="Tool allow-list"
						hint="Comma-separated. Empty = expose every tool."
					>
						<Input
							value={server.whitelist.join(", ")}
							onChange={(e) =>
								update(index, {
									whitelist: e.target.value
										.split(",")
										.map((t) => t.trim())
										.filter(Boolean),
								})
							}
							placeholder="HassTurnOn, HassTurnOff, GetLiveContext"
						/>
					</Field>

					<Collapsible>
						<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-xs outline-none">
							<ChevronDown className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
							Advanced config (JSON)
						</CollapsibleTrigger>
						<CollapsibleContent className="pt-2">
							<Textarea
								value={server.config}
								onChange={(e) => update(index, { config: e.target.value })}
								placeholder={'{ "toolParamAllow": { "*": ["name"] } }'}
								rows={3}
								className="font-mono text-xs"
								spellCheck={false}
							/>
							<p className="text-muted-foreground mt-1.5 text-[11px]">
								Adapter-specific options. For MCP, <code>toolParamAllow</code>{" "}
								limits which params each tool shows the model (e.g. only{" "}
								<code>name</code>) — improves tool-call reliability.
							</p>
						</CollapsibleContent>
					</Collapsible>
				</Card>
			))}

			<Button type="button" variant="outline" onClick={add}>
				<Plus className="size-4" />
				Add skill provider
			</Button>
		</div>
	)
}
