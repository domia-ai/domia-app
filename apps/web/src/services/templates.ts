import { eq, sql } from "drizzle-orm"
import { mindTemplate } from "@domia-app/db"
import { db } from "@/db"
import { importMind } from "@/services/mind"
import { TEMPLATE_SEEDS } from "@/constants/template-seeds"
import type { ActionResult } from "@/types"
import type {
	AppTemplate,
	ApplyTemplateInput,
	CreateTemplateInput,
	MindSnapshot,
	UpdateTemplateInput,
} from "@/types/mind"

const toAppTemplate = (row: typeof mindTemplate.$inferSelect): AppTemplate => ({
	id: row.id,
	name: row.name,
	description: row.description,
	mind: row.mind as MindSnapshot,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
})

const seedIfEmpty = () => {
	const [{ count }] = db
		.select({ count: sql<number>`count(*)` })
		.from(mindTemplate)
		.all()
	if (count > 0) return
	const now = Date.now()
	db.insert(mindTemplate)
		.values(
			TEMPLATE_SEEDS.map((t) => ({
				id: crypto.randomUUID(),
				name: t.name,
				description: t.description,
				mind: t.mind,
				createdAt: now,
				updatedAt: now,
			})),
		)
		.run()
}

export const listTemplates = (): AppTemplate[] => {
	seedIfEmpty()
	return db
		.select()
		.from(mindTemplate)
		.orderBy(mindTemplate.name)
		.all()
		.map(toAppTemplate)
}

export const getTemplate = (id: string): AppTemplate | null => {
	const [row] = db
		.select()
		.from(mindTemplate)
		.where(eq(mindTemplate.id, id))
		.limit(1)
		.all()
	return row ? toAppTemplate(row) : null
}

export const createTemplate = (
	input: CreateTemplateInput,
): ActionResult<AppTemplate> => {
	const now = Date.now()
	const id = crypto.randomUUID()
	try {
		db.insert(mindTemplate)
			.values({
				id,
				name: input.name.trim(),
				description: input.description.trim(),
				mind: input.mind,
				createdAt: now,
				updatedAt: now,
			})
			.run()
		return { ok: true, data: getTemplate(id)! }
	} catch (err) {
		return { ok: false, error: errorMessage(err, "name already in use") }
	}
}

export const updateTemplate = (
	input: UpdateTemplateInput,
): ActionResult<AppTemplate> => {
	try {
		db.update(mindTemplate)
			.set({
				name: input.name.trim(),
				description: input.description.trim(),
				mind: input.mind,
				updatedAt: Date.now(),
			})
			.where(eq(mindTemplate.id, input.id))
			.run()
		const updated = getTemplate(input.id)
		if (!updated) return { ok: false, error: "Template not found" }
		return { ok: true, data: updated }
	} catch (err) {
		return { ok: false, error: errorMessage(err, "name already in use") }
	}
}

export const deleteTemplate = (id: string): ActionResult => {
	db.delete(mindTemplate).where(eq(mindTemplate.id, id)).run()
	return { ok: true }
}

export const applyTemplate = async (
	input: ApplyTemplateInput,
): Promise<ActionResult<MindSnapshot>> => {
	const template = getTemplate(input.templateId)
	if (!template) return { ok: false, error: "Template not found" }
	return importMind({ domiaKey: input.domiaKey, mind: template.mind })
}

const errorMessage = (err: unknown, conflictHint: string): string => {
	const msg = err instanceof Error ? err.message : "Operation failed"
	return msg.includes("UNIQUE") ? conflictHint : msg
}
