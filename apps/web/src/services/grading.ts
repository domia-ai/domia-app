import { randomUUID } from "node:crypto"
import { interactionLabel } from "@domia-app/db"
import { db } from "@/db"
import { toSqliteTs } from "@/utils/format"
import type { ActionResult } from "@/types"
import type { BulkGradeInput, GradeInput } from "@/types/conversations"

export const gradeInteraction = async (
	input: GradeInput,
	author = "console",
): Promise<ActionResult> => {
	try {
		const now = toSqliteTs(Date.now())
		await db
			.insert(interactionLabel)
			.values({
				id: randomUUID(),
				interactionId: input.interactionId,
				rating: input.rating,
				correction: input.correction,
				tags: input.tags,
				author,
			})
			.onConflictDoUpdate({
				target: interactionLabel.interactionId,
				set: {
					rating: input.rating,
					correction: input.correction,
					tags: input.tags,
					updatedAt: now,
				},
			})
		return { ok: true }
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Failed to save label",
		}
	}
}

export const bulkGradeInteractions = async (
	input: BulkGradeInput,
	author = "console",
): Promise<ActionResult> => {
	try {
		if (input.ids.length === 0) return { ok: true }
		const now = toSqliteTs(Date.now())
		await db
			.insert(interactionLabel)
			.values(
				input.ids.map((interactionId) => ({
					id: randomUUID(),
					interactionId,
					rating: input.rating,
					author,
				})),
			)
			.onConflictDoUpdate({
				target: interactionLabel.interactionId,
				set: { rating: input.rating, updatedAt: now },
			})
		return { ok: true }
	} catch (error) {
		return {
			ok: false,
			error: error instanceof Error ? error.message : "Failed to grade",
		}
	}
}
