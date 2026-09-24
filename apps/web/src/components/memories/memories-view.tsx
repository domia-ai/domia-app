import { m } from "@/paraglide/messages"
import { getFactDomiaOptionsFn, listFactsFn } from "@/server/memories"
import { memoryColumns } from "./columns"
import { FactCard } from "./fact-card"
import { MemoryTableShell } from "./memory-table-shell"
import type { MemoryFactRow } from "@/types/memories"

export function MemoriesView() {
	return (
		<MemoryTableShell<MemoryFactRow>
			viewKey="memories"
			queryKey="memories"
			fetcher={(p) => listFactsFn({ data: p })}
			domiaOptionsQueryKey="memory-domia-options"
			domiaOptionsFn={() => getFactDomiaOptionsFn()}
			columns={memoryColumns}
			renderCard={(row) => <FactCard key={row.id} row={row} />}
			cardSkeletonClassName="h-36 w-full"
			searchPlaceholder={m.mem_search_placeholder()}
			loadFailedLabel={m.mem_load_failed()}
			emptyLabel={m.mem_empty()}
			emptyHint={m.mem_empty_hint()}
		/>
	)
}
