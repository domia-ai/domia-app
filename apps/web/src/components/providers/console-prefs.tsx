import { createContext, useContext, useEffect, useState } from "react"
import { LIVE_REFRESH_MS } from "@/constants/conversations"
import type { ConsolePrefs } from "@/types/settings"

const STORAGE_KEY = "domia-console-prefs"

const ConsolePrefsContext = createContext<ConsolePrefs>({
	liveRefreshMs: LIVE_REFRESH_MS,
	setLiveRefreshMs: () => {},
})

const readStored = (): number | null => {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (!raw) return null
		const parsed = JSON.parse(raw) as { liveRefreshMs?: unknown }
		return typeof parsed.liveRefreshMs === "number"
			? parsed.liveRefreshMs
			: null
	} catch {
		return null
	}
}

export function ConsolePrefsProvider({
	children,
}: {
	children: React.ReactNode
}) {
	const [liveRefreshMs, setLiveRefreshMsState] = useState(LIVE_REFRESH_MS)

	useEffect(() => {
		const stored = readStored()
		if (stored != null) setLiveRefreshMsState(stored)
	}, [])

	const setLiveRefreshMs = (ms: number) => {
		setLiveRefreshMsState(ms)
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify({ liveRefreshMs: ms }))
		} catch {
			/* storage unavailable */
		}
	}

	return (
		<ConsolePrefsContext.Provider value={{ liveRefreshMs, setLiveRefreshMs }}>
			{children}
		</ConsolePrefsContext.Provider>
	)
}

export const useConsolePrefs = (): ConsolePrefs =>
	useContext(ConsolePrefsContext)
