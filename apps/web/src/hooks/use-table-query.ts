import { keepPreviousData, useQuery } from "@tanstack/react-query"
import { tableQueryKey } from "@/utils/table-params"
import type { Paginated, TableParams } from "@/types/table"

export const useTableQuery = <T>(
	key: string,
	fetcher: (params: TableParams) => Promise<Paginated<T>>,
	params: TableParams,
	refetchInterval?: number,
) =>
	useQuery({
		queryKey: tableQueryKey(key, params),
		queryFn: () => fetcher(params),
		placeholderData: keepPreviousData,
		refetchInterval,
	})
