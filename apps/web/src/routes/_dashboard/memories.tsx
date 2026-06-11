import { createFileRoute } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { PageHeader } from "@/components/shell/page-header"
import { MemoriesView } from "@/components/memories/memories-view"
import { getFactCountFn } from "@/server/memories"
import { validateTableSearch } from "@/utils/table-params"

export const Route = createFileRoute("/_dashboard/memories")({
	validateSearch: validateTableSearch,
	head: () => ({ meta: [{ title: "Memories | Domia Console" }] }),
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
			? `${count} fact${count === 1 ? "" : "s"} learned across the mesh — what each Domia remembers about you.`
			: "What each Domia — and the mesh — remembers about you."

	return (
		<div className="space-y-6">
			<PageHeader title="Memories" description={description} />
			<MemoriesView />
		</div>
	)
}
