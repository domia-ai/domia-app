import { useEffect, useState } from "react"
import type { ViewMode } from "@/types/table"

export function useViewMode(key: string, fallback: ViewMode = "cards") {
	const storageKey = `domia-view:${key}`
	const [view, setViewState] = useState<ViewMode>(fallback)

	useEffect(() => {
		const stored = window.localStorage.getItem(storageKey)
		if (stored === "table" || stored === "cards" || stored === "map")
			setViewState(stored)
	}, [storageKey])

	const setView = (next: ViewMode) => {
		setViewState(next)
		window.localStorage.setItem(storageKey, next)
	}

	return [view, setView] as const
}
