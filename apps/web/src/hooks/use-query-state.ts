import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { m } from "@/paraglide/messages"
import { errText } from "@/utils/service-errors"
import type { QueryKey } from "@tanstack/react-query"

import type {
	ActionQueryOptions,
	ActionQueryResult,
	DataQueryOptions,
	DataQueryResult,
	QueryState,
} from "@/types/async"

export const useActionQuery = <T, TQueryKey extends QueryKey = QueryKey>({
	errorMessage,
	...options
}: ActionQueryOptions<T, TQueryKey>): ActionQueryResult<T> => {
	const query = useQuery(options)
	const { isError, data } = query
	const state = useMemo<QueryState<T | undefined>>(() => {
		if (data === undefined)
			return isError
				? { status: "error", message: (errorMessage ?? m.err_request_failed)() }
				: { status: "loading" }
		if (!data.ok) return { status: "error", message: errText(data.error) }
		return { status: "ready", data: data.data, stale: isError }
	}, [isError, data, errorMessage])

	return { query, state }
}

export const useDataQuery = <T, TQueryKey extends QueryKey = QueryKey>({
	errorMessage,
	...options
}: DataQueryOptions<T, TQueryKey>): DataQueryResult<T> => {
	const query = useQuery(options)
	const { isError, data } = query
	const state = useMemo<QueryState<T>>(() => {
		if (data === undefined)
			return isError
				? { status: "error", message: (errorMessage ?? m.err_request_failed)() }
				: { status: "loading" }
		return { status: "ready", data, stale: isError }
	}, [isError, data, errorMessage])

	return { query, state }
}
