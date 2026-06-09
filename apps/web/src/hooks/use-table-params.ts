import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useSearch } from "@tanstack/react-router"
import { parseTableParams } from "@/utils/table-params"
import type { SortState } from "@/types/table"

const SEARCH_DEBOUNCE_MS = 350

export const useTableParams = (filterKeys: string[] = []) => {
	const navigate = useNavigate()
	const search = useSearch({ strict: false }) as Record<string, unknown>
	const get = (k: string) => {
		const v = search[k]
		return v == null || v === "" ? undefined : String(v)
	}
	const params = parseTableParams(get, filterKeys)

	const update = useCallback(
		(changes: Record<string, string | null>) => {
			navigate({
				to: ".",
				replace: false,
				search: (prev: Record<string, string | undefined>) => {
					const next: Record<string, string | undefined> = { ...prev }
					for (const [k, v] of Object.entries(changes)) {
						if (v === null || v === "") delete next[k]
						else next[k] = v
					}
					return next
				},
			})
		},
		[navigate],
	)

	const [searchInput, setSearchInput] = useState(params.search)

	useEffect(() => {
		setSearchInput(params.search)
	}, [params.search])

	const first = useRef(true)
	useEffect(() => {
		if (first.current) {
			first.current = false
			return
		}
		if (searchInput === params.search) return
		const t = setTimeout(
			() => update({ q: searchInput || null, page: null }),
			SEARCH_DEBOUNCE_MS,
		)
		return () => clearTimeout(t)
	}, [searchInput, params.search, update])

	const setPage = useCallback(
		(p: number) => update({ page: String(p + 1) }),
		[update],
	)
	const setPageSize = useCallback(
		(s: number) => update({ size: String(s), page: null }),
		[update],
	)
	const setSort = useCallback(
		(s: SortState | null) =>
			update({ sort: s?.field ?? null, dir: s?.dir ?? null, page: null }),
		[update],
	)
	const setFilter = useCallback(
		(key: string, value: string | null) => update({ [key]: value, page: null }),
		[update],
	)
	const applyParams = useCallback(
		(changes: Record<string, string | null>) =>
			update({ ...changes, page: null }),
		[update],
	)

	return {
		...params,
		searchInput,
		setSearchInput,
		setPage,
		setPageSize,
		setSort,
		setFilter,
		applyParams,
	}
}
