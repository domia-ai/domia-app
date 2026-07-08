import { asc, eq } from "drizzle-orm"
import { turnEvent } from "@domia-app/db"
import { db } from "@/db"
import type { TurnEventRow } from "@domia-app/db"

export const getTurnEvents = async (
	interactionId: string,
): Promise<TurnEventRow[]> => {
	const rows = await db
		.select()
		.from(turnEvent)
		.where(eq(turnEvent.interactionId, interactionId))
		.orderBy(asc(turnEvent.seq))
	return rows
}
