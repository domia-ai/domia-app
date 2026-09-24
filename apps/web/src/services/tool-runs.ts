import { resolveNodeBase } from "@/services/fleet"
import { nodeGetToolRuns } from "@/lib/node-client"
import { nodeFailure } from "@/utils/service-errors"
import type { ActionResult } from "@/types"
import type {
	ToolRunGroup,
	ToolRunRecord,
	ToolRunsQueryInput,
} from "@/types/tool-runs"

const toRecord = (run: ToolRunRecord): ToolRunRecord => ({
	id: run.id,
	interactionId: run.interactionId,
	tool: run.tool,
	providerSlug: run.providerSlug ?? null,
	routineSlug: run.routineSlug ?? null,
	stepIndex: run.stepIndex ?? null,
	argsHash: run.argsHash ?? null,
	riskClass: run.riskClass ?? null,
	policyDecision: run.policyDecision ?? null,
	policySource: run.policySource ?? null,
	confirmationId: run.confirmationId ?? null,
	status: run.status ?? null,
	durationMs: run.durationMs ?? null,
	spokenAt: run.spokenAt ?? null,
	settledAt: run.settledAt ?? null,
	createdAt: run.createdAt,
})

const byCreation = (a: ToolRunRecord, b: ToolRunRecord): number =>
	a.createdAt.localeCompare(b.createdAt) ||
	(a.stepIndex ?? 0) - (b.stepIndex ?? 0)

const continuesRoutineRun = (open: ToolRunGroup, run: ToolRunRecord): boolean =>
	(run.stepIndex ?? 0) > (open.runs.at(-1)?.stepIndex ?? -1)

export const groupToolRuns = (runs: ToolRunRecord[]): ToolRunGroup[] => {
	const groups: ToolRunGroup[] = []
	const openBySlug = new Map<string, ToolRunGroup>()
	for (const run of [...runs].sort(byCreation)) {
		if (!run.routineSlug) {
			groups.push({
				key: `run:${run.id}`,
				routineSlug: null,
				runs: [run],
				totalMs: run.durationMs ?? 0,
			})
			continue
		}
		const open = openBySlug.get(run.routineSlug)
		if (open && continuesRoutineRun(open, run)) {
			open.runs.push(run)
			open.totalMs += run.durationMs ?? 0
			continue
		}
		const group: ToolRunGroup = {
			key: `routine:${run.routineSlug}:${run.id}`,
			routineSlug: run.routineSlug,
			runs: [run],
			totalMs: run.durationMs ?? 0,
		}
		openBySlug.set(run.routineSlug, group)
		groups.push(group)
	}
	return groups
}

export const getToolRuns = async ({
	domiaKey,
	interactionId,
}: ToolRunsQueryInput): Promise<ActionResult<ToolRunGroup[]>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	try {
		const { toolRuns } = await nodeGetToolRuns(
			base.data,
			domiaKey,
			interactionId,
		)
		return { ok: true, data: groupToolRuns(toolRuns.map(toRecord)) }
	} catch (err) {
		return nodeFailure(err, "Could not load tool runs")
	}
}
