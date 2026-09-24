import type { ReactNode } from "react"
import type {
	QueryKey,
	UseQueryOptions,
	UseQueryResult,
} from "@tanstack/react-query"
import type { ActionResult } from "@/types"

export type QueryState<T> =
	| { status: "loading" }
	| { status: "error"; message: string }
	| { status: "ready"; data: T; stale: boolean }

export type NodeRequestErrorBody = {
	error?: string
}

export type NodeRequestError = Error & {
	status: number
	path: string
	body: NodeRequestErrorBody | null
}

export type ActionQueryOptions<
	T,
	TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<ActionResult<T>, Error, ActionResult<T>, TQueryKey> & {
	errorMessage?: () => string
}

export type DataQueryOptions<
	T,
	TQueryKey extends QueryKey = QueryKey,
> = UseQueryOptions<T, Error, T, TQueryKey> & {
	errorMessage?: () => string
}

export type ActionQueryResult<T> = {
	query: UseQueryResult<ActionResult<T>, Error>
	state: QueryState<T | undefined>
}

export type DataQueryResult<T> = {
	query: UseQueryResult<T, Error>
	state: QueryState<T>
}

export type AsyncBoundaryProps<T> = {
	state: QueryState<T>
	skeleton?: ReactNode
	children: (data: T) => ReactNode
}

export type ActionMutationOptions<TData, TVars> = {
	mutationFn: (vars: TVars) => Promise<ActionResult<TData>>
	failureTitle: () => string
	onDone?: (data: TData | undefined, vars: TVars) => void
	onFail?: (vars: TVars) => void
}
