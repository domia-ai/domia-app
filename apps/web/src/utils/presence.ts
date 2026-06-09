export const ONLINE_THRESHOLD_MS = 90_000

export const isOnline = (lastSeenAt: number): boolean =>
	Date.now() - lastSeenAt < ONLINE_THRESHOLD_MS
