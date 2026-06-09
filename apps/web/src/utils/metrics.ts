import type { LatencySummary } from "@/types/analytics"

export type LatencyFields = {
	sttMs: number | null
	llmMs: number | null
	ttfaMs: number | null
	llmExecutorKey: string | null
	sourceDomiaKey: string
}

export const percentile = (sorted: number[], p: number): number | null => {
	if (sorted.length === 0) return null
	const idx = Math.min(
		sorted.length - 1,
		Math.ceil((p / 100) * sorted.length) - 1,
	)
	return sorted[Math.max(0, idx)]
}

export const summarize = (values: number[]): LatencySummary => {
	const v = values
		.filter((n) => Number.isFinite(n) && n > 0)
		.sort((a, b) => a - b)
	return {
		count: v.length,
		p50: percentile(v, 50),
		p95: percentile(v, 95),
		avg: v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null,
	}
}

export const avgOf = (values: number[]): number => {
	const v = values.filter((n) => Number.isFinite(n) && n > 0)
	return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : 0
}

export const effectiveTtfa = (r: LatencyFields): number =>
	r.ttfaMs && r.ttfaMs > 0 ? r.ttfaMs : (r.sttMs ?? 0) + (r.llmMs ?? 0)

export const isDelegated = (r: LatencyFields): boolean =>
	r.llmExecutorKey != null && r.llmExecutorKey !== r.sourceDomiaKey
