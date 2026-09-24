import { m } from "@/paraglide/messages"
import { getEpisodeDomiaOptionsFn, listEpisodesFn } from "@/server/memories"
import { episodeColumns } from "./episode-columns"
import { EpisodeCard } from "./episode-card"
import { MemoryTableShell } from "./memory-table-shell"
import type { MemoryEpisodeRow } from "@/types/memories"

export function EpisodesView() {
	return (
		<MemoryTableShell<MemoryEpisodeRow>
			viewKey="memory-episodes"
			queryKey="memory-episodes"
			fetcher={(p) => listEpisodesFn({ data: p })}
			domiaOptionsQueryKey="episode-domia-options"
			domiaOptionsFn={() => getEpisodeDomiaOptionsFn()}
			columns={episodeColumns}
			renderCard={(row) => <EpisodeCard key={row.id} row={row} />}
			cardSkeletonClassName="h-40 w-full"
			searchPlaceholder={m.mem_episodes_search_placeholder()}
			loadFailedLabel={m.mem_episodes_load_failed()}
			emptyLabel={m.mem_episodes_empty()}
			emptyHint={m.mem_episodes_empty_hint()}
		/>
	)
}
