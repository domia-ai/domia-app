import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { Brain, Lightbulb, Waypoints } from "lucide-react"
import { PageHeader } from "@/components/shell/page-header"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MemoriesView } from "@/components/memories/memories-view"
import { EpisodesView } from "@/components/memories/episodes-view"
import { UserModelView } from "@/components/memories/user-model-view"
import { useDataQuery } from "@/hooks/use-query-state"
import { getMemoryCountsFn } from "@/server/memories"
import { validateTableSearch } from "@/utils/table-params"
import { m } from "@/paraglide/messages"
import type { MemoriesTab } from "@/types/memories"

const TABS: MemoriesTab[] = ["facts", "episodes", "user-model"]

const isTab = (value: unknown): value is MemoriesTab =>
	TABS.includes(value as MemoriesTab)

export const Route = createFileRoute("/_dashboard/memories")({
	validateSearch: validateTableSearch,
	head: () => ({ meta: [{ title: m.meta_title({ page: m.nav_memories() }) }] }),
	component: MemoriesPage,
})

function TabCount({ value }: { value: number | null }) {
	if (value === null) return null
	return (
		<Badge variant="secondary" className="text-[10px] tabular-nums">
			{value}
		</Badge>
	)
}

function MemoriesPage() {
	const navigate = useNavigate()
	const search = Route.useSearch()
	const tab: MemoriesTab = isTab(search.tab) ? search.tab : "facts"

	const { state } = useDataQuery({
		queryKey: ["memory-counts"],
		queryFn: () => getMemoryCountsFn(),
	})
	const counts = state.status === "ready" ? state.data : null

	const description =
		counts === null
			? m.route_memories_description()
			: counts.facts === 1
				? m.route_memories_description_one()
				: m.route_memories_description_many({ count: counts.facts })

	return (
		<div className="space-y-6">
			<PageHeader title={m.nav_memories()} description={description} />
			<Tabs
				value={tab}
				onValueChange={(next) =>
					navigate({
						to: ".",
						search: (prev: Record<string, string | undefined>) => ({
							...prev,
							tab: next === "facts" ? undefined : String(next),
							page: undefined,
							q: undefined,
							sort: undefined,
							dir: undefined,
						}),
					})
				}
				className="gap-6"
			>
				<TabsList>
					<TabsTrigger value="facts">
						<Lightbulb className="size-4" />
						{m.mem_tab_facts()}
						<TabCount value={counts?.facts ?? null} />
					</TabsTrigger>
					<TabsTrigger value="episodes">
						<Waypoints className="size-4" />
						{m.mem_tab_episodes()}
						<TabCount value={counts?.episodes ?? null} />
					</TabsTrigger>
					<TabsTrigger value="user-model">
						<Brain className="size-4" />
						{m.mem_tab_user_model()}
						<TabCount value={counts?.userModels ?? null} />
					</TabsTrigger>
				</TabsList>

				<TabsContent value="facts">
					<MemoriesView />
				</TabsContent>
				<TabsContent value="episodes">
					<EpisodesView />
				</TabsContent>
				<TabsContent value="user-model">
					<UserModelView />
				</TabsContent>
			</Tabs>
		</div>
	)
}
