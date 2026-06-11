export type ConsolePrefs = {
	liveRefreshMs: number
	setLiveRefreshMs: (ms: number) => void
}

export type SyncStatusRow = {
	domiaKey: string
	name: string | null
	avatarId: string | null
	online: boolean
	lastSyncedAt: number | null
	cursorAt: string | null
}

export type DataCounts = {
	domias: number
	interactions: number
	sessions: number
	memoryFacts: number
	emotionEvents: number
	audioAssets: number
	templates: number
}

export type SettingsOverview = {
	sync: SyncStatusRow[]
	counts: DataCounts
	dbBytes: number | null
	version: string
}
