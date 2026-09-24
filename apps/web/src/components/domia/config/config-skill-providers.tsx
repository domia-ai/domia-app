import { Fragment } from "react"
import { Plus, Trash2, Server, ChevronDown, FilePlus2 } from "lucide-react"
import type { DiscoveredSkillProvider } from "@/types/skills"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SKILL_PRESETS } from "@/constants/skill-presets"
import {
	DEFAULT_SKILL_TRUST_TIER,
	DESCRIPTOR_DEFAULT_LIMITS,
	SKILL_ADVANCED_CONFIG_JSON_SAMPLE,
	SKILL_ADVANCED_CONFIG_KEYS,
	SKILL_HEADERS_JSON_SAMPLE,
	SKILL_TRANSPORT_OPTIONS,
	SKILL_TRUST_TIER_META,
	SKILL_TRUST_TIER_VALUES,
} from "@/constants/skills"
import { useActionQuery } from "@/hooks/use-query-state"
import {
	descriptorSchemaQueryOptions,
	skillsStatusQueryOptions,
} from "@/server/skills"
import { toDescriptorLimits } from "@/schemas/descriptor"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { ConfigSkillDescriptor } from "./config-skill-descriptor"
import { ToolChecklist } from "./config-fast-path"
import { SkillProviderDiscovery } from "./config-skill-discovery"
import { DescriptorField } from "./descriptor-fields"
import type {
	ConfigSkillProvidersProps,
	ServerDescriptorPanelProps,
	SkillProviderDraft,
} from "@/types/config"
import type {
	DescriptorLimitsView,
	SkillDescriptorSchemaInfo,
	SkillToolOptions,
	SkillToolOptionsStatus,
	SkillTrustTier,
	SkillsStatusResult,
} from "@/types/skills"
import { isBuiltinSkillProvider } from "@/utils/skill-providers"

const SKILL_PROTOCOLS: {
	value: SkillProviderDraft["protocol"]
	label: () => string
	available: boolean
}[] = [
	{ value: "mcp", label: () => "MCP", available: true },
	{ value: "http", label: m.config_skill_proto_http, available: false },
	{ value: "mqtt", label: m.config_skill_proto_mqtt, available: false },
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
	trustTier: DEFAULT_SKILL_TRUST_TIER,
}

const presetHint = (kind?: string): (() => string) | undefined =>
	kind
		? SKILL_PRESETS.find((p) => p.draft.descriptor?.kind === kind)?.hintKey
		: undefined

const advancedKeys = (kind?: string): string[] => [
	...SKILL_ADVANCED_CONFIG_KEYS["*"],
	...(kind ? (SKILL_ADVANCED_CONFIG_KEYS[kind] ?? []) : []),
]

function ServerDescriptorPanel({
	descriptor,
	hash,
}: ServerDescriptorPanelProps) {
	if (!descriptor) return null
	return (
		<div className="mt-4 space-y-2 border-t pt-4">
			<div className="space-y-0.5">
				<p className="text-xs font-semibold tracking-wide uppercase opacity-70">
					{m.skills_server_descriptor()}
				</p>
				<p className="text-muted-foreground text-[11px]">
					{m.skills_server_descriptor_hint()}
				</p>
				{hash && (
					<code className="text-muted-foreground font-mono text-[11px]">
						{hash}
					</code>
				)}
			</div>
			<Collapsible>
				<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-xs outline-none">
					<ChevronDown className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
					{m.skills_server_descriptor()}
				</CollapsibleTrigger>
				<CollapsibleContent className="pt-2">
					<pre className="bg-muted max-h-72 overflow-auto rounded-md p-2 font-mono text-[11px]">
						{JSON.stringify(descriptor, null, 2)}
					</pre>
				</CollapsibleContent>
			</Collapsible>
		</div>
	)
}

export function ConfigSkillProviders({
	draft,
	domiaKey,
}: ConfigSkillProvidersProps) {
	const servers = draft.skillProviders
	const enabled = domiaKey !== ""
	const { state: skillsState } = useActionQuery<SkillsStatusResult, string[]>({
		...skillsStatusQueryOptions(domiaKey),
		enabled,
	})
	const { state: schemaState } = useActionQuery<
		SkillDescriptorSchemaInfo,
		string[]
	>({
		...descriptorSchemaQueryOptions(domiaKey),
		enabled,
	})

	const toolsStatus: SkillToolOptionsStatus = !enabled
		? "ready"
		: skillsState.status === "loading"
			? "loading"
			: skillsState.status === "error"
				? "error"
				: "ready"
	const statuses =
		skillsState.status === "ready" ? (skillsState.data?.providers ?? []) : []
	const toolsFor = (server: SkillProviderDraft): SkillToolOptions => ({
		status: toolsStatus,
		tools: statuses.find((p) => p.id === server.id)?.tools ?? [],
		message: skillsState.status === "error" ? skillsState.message : null,
	})

	const info = schemaState.status === "ready" ? schemaState.data : undefined
	const limits: DescriptorLimitsView = {
		limits: info ? toDescriptorLimits(info.limits) : DESCRIPTOR_DEFAULT_LIMITS,
		fromNode: enabled && schemaState.status !== "error",
		resourceUri: info?.resourceUri ?? null,
		stripped: info?.stripped ?? [],
		rejected: info?.rejected ?? [],
	}

	const addDiscovered = (found: DiscoveredSkillProvider) => {
		const preset = SKILL_PRESETS.find((p) => p.id === found.kind)?.draft ?? {}
		add({
			...preset,
			name: found.kind,
			type: "http",
			url: found.url,
		})
	}

	const update = (index: number, patch: Partial<SkillProviderDraft>) =>
		draft.setSkillProviders(
			servers.map((s, i) => (i === index ? { ...s, ...patch } : s)),
		)

	const add = (preset?: Partial<SkillProviderDraft>) =>
		draft.setSkillProviders([...servers, { ...EMPTY_SERVER, ...preset }])
	const remove = (index: number) =>
		draft.setSkillProviders(servers.filter((_, i) => i !== index))

	return (
		<div className="space-y-3">
			{servers.length === 0 && (
				<div className="text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-sm">
					<Server className="mx-auto mb-2 size-5 opacity-60" />
					{m.config_skill_none()}
				</div>
			)}

			{servers.map((server, index) => {
				const builtin = isBuiltinSkillProvider(server)
				const hint = builtin ? undefined : presetHint(server.descriptor?.kind)
				return (
					<Card key={index} className="space-y-3 p-4">
						<div className="flex items-center justify-between gap-2">
							<span className="truncate text-sm font-medium">
								{server.name.trim() || m.config_skill_new_provider()}
							</span>
							{!builtin && (
								<Button
									type="button"
									variant="ghost"
									size="sm"
									className="text-muted-foreground hover:text-destructive -my-1 h-7 px-2"
									onClick={() => remove(index)}
								>
									<Trash2 className="size-3.5" />
								</Button>
							)}
						</div>

						{builtin && (
							<p className="text-muted-foreground text-xs">
								{m.config_skill_builtin_hint()}
							</p>
						)}

						<div
							className={
								builtin
									? "grid gap-3"
									: "grid gap-3 sm:grid-cols-[1fr_8rem_9rem]"
							}
						>
							<DescriptorField
								label={
									builtin
										? m.config_skill_builtin_name()
										: m.config_skill_name()
								}
							>
								<Input
									value={server.name}
									onChange={(e) => update(index, { name: e.target.value })}
									placeholder={m.desc_provider_name_placeholder()}
									disabled={builtin}
								/>
							</DescriptorField>
							{!builtin && (
								<DescriptorField label={m.config_skill_protocol()}>
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
													{p.label()}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</DescriptorField>
							)}
							{server.protocol === "mcp" && (
								<DescriptorField label={m.config_skill_transport()}>
									<Select
										value={server.type}
										onValueChange={(v) => {
											const option = SKILL_TRANSPORT_OPTIONS.find(
												(o) => o.value === v,
											)
											if (option) update(index, { type: option.value })
										}}
									>
										<SelectTrigger>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{SKILL_TRANSPORT_OPTIONS.map((option) => (
												<SelectItem key={option.value} value={option.value}>
													{option.label()}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</DescriptorField>
							)}
						</div>

						{!builtin && (
							<DescriptorField
								label={m.config_skill_endpoint_url()}
								hint={
									server.type === "stdio"
										? m.desc_provider_stdio_hint()
										: undefined
								}
							>
								<Input
									value={server.url}
									onChange={(e) => update(index, { url: e.target.value })}
									placeholder={m.desc_endpoint_url_placeholder()}
								/>
							</DescriptorField>
						)}

						{!builtin && (
							<div className="grid gap-3 sm:grid-cols-[10rem_1fr]">
								<DescriptorField label={m.config_skill_auth()}>
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
											<SelectItem value="none">
												{m.config_skill_auth_none()}
											</SelectItem>
											<SelectItem value="bearer">
												{m.config_skill_auth_bearer()}
											</SelectItem>
											<SelectItem value="headers">
												{m.config_skill_auth_headers()}
											</SelectItem>
										</SelectContent>
									</Select>
								</DescriptorField>
								{server.authKind === "bearer" && (
									<DescriptorField
										label={m.config_skill_token()}
										hint={m.config_skill_token_hint()}
									>
										<Input
											type="password"
											value={server.token}
											onChange={(e) => update(index, { token: e.target.value })}
											placeholder={m.config_secret_placeholder()}
											autoComplete="off"
										/>
									</DescriptorField>
								)}
								{server.authKind === "headers" && (
									<DescriptorField
										label={m.config_skill_headers()}
										hint={m.config_skill_headers_hint()}
									>
										<Textarea
											value={server.headers}
											onChange={(e) =>
												update(index, { headers: e.target.value })
											}
											placeholder={SKILL_HEADERS_JSON_SAMPLE}
											rows={2}
											className="font-mono text-xs"
											spellCheck={false}
											autoComplete="off"
										/>
									</DescriptorField>
								)}
							</div>
						)}

						<ToolChecklist
							label={m.config_skill_allowlist()}
							hint={m.config_skill_allowlist_hint()}
							note={
								server.whitelist.length > 0
									? m.fastpath_tools_filtered_note()
									: undefined
							}
							value={server.whitelist}
							onChange={(whitelist) => update(index, { whitelist })}
							options={toolsFor(server)}
							placeholder={m.desc_allowlist_placeholder()}
						/>

						{!builtin && (
							<DescriptorField
								label={m.config_skill_trust_tier()}
								hint={SKILL_TRUST_TIER_META[server.trustTier].help()}
							>
								<Select
									value={server.trustTier}
									onValueChange={(v) =>
										update(index, { trustTier: v as SkillTrustTier })
									}
								>
									<SelectTrigger className="sm:w-48">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{SKILL_TRUST_TIER_VALUES.map((tier) => (
											<SelectItem key={tier} value={tier}>
												{SKILL_TRUST_TIER_META[tier].label()}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</DescriptorField>
						)}

						<Collapsible>
							<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-xs outline-none">
								<ChevronDown className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
								{m.config_skill_advanced()}
							</CollapsibleTrigger>
							<CollapsibleContent className="pt-2">
								{!builtin && (
									<>
										<Textarea
											value={server.config}
											onChange={(e) =>
												update(index, { config: e.target.value })
											}
											placeholder={SKILL_ADVANCED_CONFIG_JSON_SAMPLE}
											rows={3}
											className="font-mono text-xs"
											spellCheck={false}
										/>
										<p className="text-muted-foreground mt-1.5 text-[11px]">
											{m.config_skill_advanced_hint()}{" "}
											{advancedKeys(server.descriptor?.kind).map((key, i) => (
												<Fragment key={key}>
													{i > 0 && ", "}
													<code>{key}</code>
												</Fragment>
											))}
											{m.config_skill_advanced_hint_end()}
										</p>
									</>
								)}
								<div className={builtin ? undefined : "mt-4 border-t pt-4"}>
									{hint && (
										<p className="text-muted-foreground mb-3 text-[11px]">
											{hint()}
										</p>
									)}
									<ConfigSkillDescriptor
										value={server.descriptor}
										onChange={(descriptor) => update(index, { descriptor })}
										options={toolsFor(server)}
										limits={limits}
										kindLocked={builtin}
									/>
									<ServerDescriptorPanel
										descriptor={server.serverDescriptor}
										hash={server.serverDescriptorHash}
									/>
								</div>
							</CollapsibleContent>
						</Collapsible>
					</Card>
				)
			})}

			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button type="button" variant="outline">
							<Plus className="size-4" />
							{m.config_skill_add_from_template()}
							<ChevronDown className="size-3.5 opacity-60" />
						</Button>
					}
				/>
				<DropdownMenuContent align="start" className="w-72">
					{SKILL_PRESETS.map((preset) => {
						const Icon = preset.icon
						return (
							<DropdownMenuItem
								key={preset.id}
								className="items-start gap-2.5"
								onClick={() => add(preset.draft)}
							>
								{Icon && <Icon className="mt-0.5 size-4 shrink-0 opacity-70" />}
								<span className="flex flex-col gap-0.5">
									<span className="text-sm font-medium">
										{preset.labelKey()}
									</span>
									<span className="text-muted-foreground text-xs">
										{preset.descriptionKey()}
									</span>
								</span>
							</DropdownMenuItem>
						)
					})}
					<DropdownMenuSeparator />
					<DropdownMenuItem className="gap-2.5" onClick={() => add()}>
						<FilePlus2 className="size-4 shrink-0 opacity-70" />
						<span className="text-sm">{m.config_skill_preset_blank()}</span>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
			{domiaKey && (
				<SkillProviderDiscovery
					domiaKey={domiaKey}
					existingUrls={servers.map((s) => s.url)}
					onAdd={addDiscovered}
				/>
			)}
		</div>
	)
}
