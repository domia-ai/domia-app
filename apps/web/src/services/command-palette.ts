import { desc, eq } from "drizzle-orm"
import { domiaRegistry, interactionTrace } from "@domia-app/db"
import { db } from "@/db"
import type { CommandPaletteData } from "@/types"

const DOMIA_LIMIT = 100
const CONVERSATION_LIMIT = 25

export const getCommandPalette = async (): Promise<CommandPaletteData> => {
	const [domias, conversations] = await Promise.all([
		db
			.select({ domiaKey: domiaRegistry.domiaKey, name: domiaRegistry.name })
			.from(domiaRegistry)
			.limit(DOMIA_LIMIT),
		db
			.select({
				id: interactionTrace.id,
				sttResult: interactionTrace.sttResult,
				inputRaw: interactionTrace.inputRaw,
				reply: interactionTrace.llmResponse,
				domiaName: domiaRegistry.name,
				sourceDomiaKey: interactionTrace.sourceDomiaKey,
			})
			.from(interactionTrace)
			.leftJoin(
				domiaRegistry,
				eq(interactionTrace.sourceDomiaKey, domiaRegistry.domiaKey),
			)
			.orderBy(desc(interactionTrace.createdAt))
			.limit(CONVERSATION_LIMIT),
	])

	return {
		domias: domias.map((d) => ({
			domiaKey: d.domiaKey,
			name: d.name ?? d.domiaKey,
		})),
		conversations: conversations.map((c) => ({
			id: c.id,
			input: c.sttResult ?? c.inputRaw ?? "—",
			reply: c.reply,
			domia: c.domiaName ?? c.sourceDomiaKey,
		})),
	}
}
