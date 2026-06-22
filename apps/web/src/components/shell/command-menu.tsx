import { useEffect, useState } from "react"
import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
	BarChart3,
	BrainCircuit,
	HeartPulse,
	LayoutDashboard,
	MessageSquareText,
	MessagesSquare,
	Network,
	Pencil,
	Radio,
	Search,
	Server,
	Settings,
	Sparkles,
	Workflow,
	Zap,
} from "lucide-react"
import {
	CommandDialog,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command"
import { commandPaletteQueryOptions } from "@/server/command-palette"
import type { NavItem } from "@/types"

const PAGES: NavItem[] = [
	{ href: "/", label: "Overview", icon: LayoutDashboard },
	{ href: "/live", label: "Live", icon: Radio },
	{ href: "/nodes", label: "Nodes", icon: Server },
	{ href: "/mesh", label: "Mesh", icon: Workflow },
	{ href: "/domias", label: "Domias", icon: Network },
	{ href: "/conversations", label: "Conversations", icon: MessagesSquare },
	{ href: "/chat", label: "Chat", icon: MessageSquareText },
	{ href: "/emotions", label: "Emotions", icon: HeartPulse },
	{ href: "/memories", label: "Memories", icon: BrainCircuit },
	{ href: "/analytics", label: "Analytics", icon: BarChart3 },
	{ href: "/settings", label: "Settings", icon: Settings },
]

function ActionTag() {
	return (
		<span className="bg-muted/60 text-muted-foreground ml-auto inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium">
			<Zap className="size-2.5" />
			control plane
		</span>
	)
}

export function CommandMenu() {
	const navigate = useNavigate()
	const [open, setOpen] = useState(false)

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault()
				setOpen((prev) => !prev)
			}
		}
		document.addEventListener("keydown", onKey)
		return () => document.removeEventListener("keydown", onKey)
	}, [])

	const { data, isLoading, isError } = useQuery({
		...commandPaletteQueryOptions(),
		enabled: open,
	})

	const domias = data?.domias ?? []
	const conversations = data?.conversations ?? []
	const loading = isLoading
	const failed = isError

	const close = () => setOpen(false)

	return (
		<>
			<button
				type="button"
				onClick={() => setOpen(true)}
				className="border-input bg-card text-muted-foreground hover:bg-accent flex h-9 w-full max-w-sm items-center gap-2 rounded-md border px-3 text-sm transition-colors"
			>
				<Search className="size-4" />
				<span className="flex-1 text-left">Search the mesh…</span>
				<kbd className="bg-muted pointer-events-none hidden items-center gap-0.5 rounded border px-1.5 font-mono text-[10px] font-medium sm:inline-flex">
					⌘K
				</kbd>
			</button>

			<CommandDialog open={open} onOpenChange={setOpen}>
				<CommandInput placeholder="Search Domias, conversations, actions…" />
				<CommandList>
					<CommandEmpty>
						{loading
							? "Loading…"
							: failed
								? "Couldn’t load the mesh — try reopening."
								: "No results found."}
					</CommandEmpty>

					{domias.length > 0 && (
						<CommandGroup heading="Actions">
							{domias.map((domia) => (
								<CommandItem
									key={`talk-${domia.domiaKey}`}
									value={`talk chat ${domia.name} ${domia.domiaKey}`}
									onSelect={() => {
										close()
										navigate({
											to: "/chat",
											search: { domia: domia.domiaKey },
										})
									}}
								>
									<MessageSquareText className="size-4" />
									Talk to {domia.name}
									<ActionTag />
								</CommandItem>
							))}
							{domias.map((domia) => (
								<CommandItem
									key={`persona-${domia.domiaKey}`}
									value={`edit persona ${domia.name} ${domia.domiaKey}`}
									onSelect={() => {
										close()
										navigate({
											to: "/domias/$key",
											params: { key: domia.domiaKey },
										})
									}}
								>
									<Pencil className="size-4" />
									Edit persona of {domia.name}
									<ActionTag />
								</CommandItem>
							))}
							{domias.map((domia) => (
								<CommandItem
									key={`template-${domia.domiaKey}`}
									value={`activate template ${domia.name} ${domia.domiaKey}`}
									onSelect={() => {
										close()
										navigate({
											to: "/domias/$key",
											params: { key: domia.domiaKey },
										})
									}}
								>
									<Sparkles className="size-4" />
									Activate template on {domia.name}
									<ActionTag />
								</CommandItem>
							))}
						</CommandGroup>
					)}

					<CommandSeparator />
					<CommandGroup heading="Pages">
						{PAGES.map((page) => {
							const Icon = page.icon
							return (
								<CommandItem
									key={page.href}
									value={`page ${page.label}`}
									onSelect={() => {
										close()
										navigate({ to: page.href })
									}}
								>
									<Icon className="size-4" />
									{page.label}
								</CommandItem>
							)
						})}
					</CommandGroup>

					{domias.length > 0 && (
						<>
							<CommandSeparator />
							<CommandGroup heading="Domias">
								{domias.map((domia) => (
									<CommandItem
										key={domia.domiaKey}
										value={`domia ${domia.name} ${domia.domiaKey}`}
										onSelect={() => {
											close()
											navigate({
												to: "/domias/$key",
												params: { key: domia.domiaKey },
											})
										}}
									>
										<Network className="size-4" />
										{domia.name}
										<span className="text-muted-foreground ml-auto font-mono text-xs">
											{domia.domiaKey}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</>
					)}

					{conversations.length > 0 && (
						<>
							<CommandSeparator />
							<CommandGroup heading="Conversations">
								{conversations.map((c) => (
									<CommandItem
										key={c.id}
										value={`conversation ${c.input} ${c.reply ?? ""} ${c.domia} ${c.id}`}
										onSelect={() => {
											close()
											navigate({
												to: "/conversations/$id",
												params: { id: c.id },
											})
										}}
									>
										<MessagesSquare className="size-4 shrink-0" />
										<span className="truncate">{c.input}</span>
										<span className="text-muted-foreground ml-auto shrink-0 text-xs">
											{c.domia}
										</span>
									</CommandItem>
								))}
							</CommandGroup>
						</>
					)}
				</CommandList>
			</CommandDialog>
		</>
	)
}
