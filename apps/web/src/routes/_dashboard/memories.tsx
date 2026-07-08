import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/shell/page-header"
import { MemoriesView } from "@/components/memories/memories-view"
import { getFactCountFn } from "@/server/memories"
import { validateTableSearch } from "@/utils/table-params"
import { m } from "@/paraglide/messages"

export const Route = createFileRoute("/_dashboard/memories")({
	validateSearch: validateTableSearch,
	head: () => ({ meta: [{ title: m.meta_title({ page: m.nav_memories() }) }] }),
	component: MemoriesPage,
})

function MemoriesPage() {
	const countQuery = useQuery({
		queryKey: ["memory-fact-count"],
		queryFn: () => getFactCountFn(),
	})

	const count = countQuery.data
	const description =
		count != null
			? count === 1
				? m.route_memories_description_one()
				: m.route_memories_description_many({ count })
			: m.route_memories_description()

	return (
		<div className="space-y-6">
			<PageHeader title={m.nav_memories()} description={description} />
			<MemoriesView />
		</div>
	)
}
