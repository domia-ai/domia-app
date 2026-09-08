import { resolveNodeBase } from "@/services/fleet"
import { nodeRunBench } from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { BenchRunInput, BenchRunResult } from "@/types/bench"

export const runBench = async (
	input: BenchRunInput,
): Promise<ActionResult<BenchRunResult>> => {
	const base = await resolveNodeBase(input.domiaKey)
	if (!base.ok) return base
	try {
		return {
			ok: true,
			data: await nodeRunBench(base.data, input.domiaKey, {
				...(input.turns != null ? { turns: input.turns } : {}),
			}),
		}
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Health check failed",
		}
	}
}
