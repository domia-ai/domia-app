import { and, count, isNotNull, ne } from "drizzle-orm"
import { domiaRegistry, interactionTrace } from "@domia-app/db"
import { db } from "@/db"
import type { ActionResult } from "@/types"
import type {
	MeshCapability,
	MeshEdge,
	MeshIdentity,
	MeshNode,
	MeshTopology,
} from "@/types/mesh"

const nodeIdOf = (localIp: string, httpPort: number): string =>
	`${localIp}-${httpPort}`

const capsFromSnapshot = (
	json: string | null,
): { stt: boolean; llm: boolean; tts: boolean } => {
	try {
		const rc = json ? JSON.parse(json)?.runtimeCapabilities : null
		return {
			stt: !!rc?.stt,
			llm: !!rc?.llm,
			tts: !!rc?.tts,
		}
	} catch {
		return { stt: false, llm: false, tts: false }
	}
}

const edgesForCapability = async (
	capability: MeshCapability,
	executorCol:
		| typeof interactionTrace.sttExecutorKey
		| typeof interactionTrace.llmExecutorKey
		| typeof interactionTrace.ttsExecutorKey,
): Promise<Omit<MeshEdge, "crossHost">[]> => {
	const rows = await db
		.select({
			from: interactionTrace.sourceDomiaKey,
			to: executorCol,
			n: count(),
		})
		.from(interactionTrace)
		.where(
			and(
				isNotNull(executorCol),
				ne(executorCol, interactionTrace.sourceDomiaKey),
			),
		)
		.groupBy(interactionTrace.sourceDomiaKey, executorCol)
	return rows
		.filter((r): r is { from: string; to: string; n: number } => !!r.to)
		.map((r) => ({ from: r.from, to: r.to, capability, count: r.n }))
}

export const getMeshTopology = async (): Promise<
	ActionResult<MeshTopology>
> => {
	try {
		const rows = await db
			.select({
				domiaKey: domiaRegistry.domiaKey,
				name: domiaRegistry.name,
				nodeId: domiaRegistry.nodeId,
				localIp: domiaRegistry.localIp,
				httpPort: domiaRegistry.httpPort,
				isHosted: domiaRegistry.isHosted,
				isPrincipal: domiaRegistry.isPrincipal,
				snapshot: domiaRegistry.configSnapshotJson,
			})
			.from(domiaRegistry)

		const nodeOfKey = new Map<string, string>()
		const groups = new Map<
			string,
			{ nodeName: string; identities: MeshIdentity[] }
		>()
		for (const r of rows) {
			if (!r.localIp || !r.httpPort) continue
			const nodeId = r.nodeId ?? nodeIdOf(r.localIp, r.httpPort)
			nodeOfKey.set(r.domiaKey, nodeId)
			if (!r.isHosted) continue
			const group = groups.get(nodeId) ?? { nodeName: "", identities: [] }
			group.identities.push({
				domiaKey: r.domiaKey,
				name: r.name,
				isPrincipal: r.isPrincipal,
				caps: capsFromSnapshot(r.snapshot),
			})
			if (r.isPrincipal) group.nodeName = r.name
			groups.set(nodeId, group)
		}

		const nodes: MeshNode[] = [...groups.entries()].map(
			([nodeId, g]): MeshNode => ({
				nodeId,
				nodeName: g.nodeName || g.identities[0]?.name || nodeId,
				identities: g.identities,
			}),
		)

		const rawEdges = [
			...(await edgesForCapability("STT", interactionTrace.sttExecutorKey)),
			...(await edgesForCapability("LLM", interactionTrace.llmExecutorKey)),
			...(await edgesForCapability("TTS", interactionTrace.ttsExecutorKey)),
		]
		const edges: MeshEdge[] = rawEdges.map((e) => ({
			...e,
			crossHost: nodeOfKey.get(e.from) !== nodeOfKey.get(e.to),
		}))

		return { ok: true, data: { nodes, edges } }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "Could not load topology",
		}
	}
}
