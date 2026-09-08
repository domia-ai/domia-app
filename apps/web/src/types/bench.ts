import type { ConfigHealth } from "@/types/config"

export type BenchVerdict = "ok" | "slow" | "failed"

export type BenchStageVerdict = {
	stage: string
	verdict: BenchVerdict
	samples: number
	p50: number | null
	p95: number | null
	thresholdMs: number
	suggestion?: string
}

export type BenchTurnRow = {
	id: string
	interactionId: string | null
	status: "ok" | "failed" | "skipped"
	transcript: string
	sttMs: number | null
	llmTtftMs: number | null
	llmMs: number | null
	ttsMs: number | null
	toolMs: number | null
	totalMs: number | null
	error?: string
}

export type BenchHardware = {
	hardwareClass: string
	hardwareLabel: string
	platform: string
	cpu: string
	cores: number
	totalMemGb: number
}

export type BenchTurnCounts = {
	requested: number
	completed: number
	failed: number
	skipped: number
}

export type BenchRunResult = {
	ok: boolean
	verdict: BenchVerdict
	hardware: BenchHardware
	turns: BenchTurnCounts
	durationMs: number
	startedAt: string
	stages: BenchStageVerdict[]
	rows: BenchTurnRow[]
	health: ConfigHealth
}

export type BenchRunInput = {
	domiaKey: string
	turns?: number
}

export type BenchRunBody = {
	turns?: number
}
