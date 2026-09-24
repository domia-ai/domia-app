import { z } from "zod"
import {
	MIND_BUNDLE_VERSION,
	MIND_IMPORT_MODES,
	MIND_SECTIONS,
} from "@/constants/mind-transfer"
import type { MindSection } from "@/types/mind-transfer"

export const mindSectionNameSchema = z.enum(MIND_SECTIONS)

export const mindImportModeSchema = z.enum(MIND_IMPORT_MODES)

export const mindSectionDataSchema = z
	.object({
		columns: z.array(z.string().min(1)).min(1),
		rows: z.array(z.array(z.unknown())),
	})
	.refine(
		(section) =>
			section.rows.every((row) => row.length === section.columns.length),
		"every row must have one value per column",
	)

const sectionsShape = Object.fromEntries(
	MIND_SECTIONS.map((name) => [name, mindSectionDataSchema.optional()]),
) as Record<MindSection, z.ZodOptional<typeof mindSectionDataSchema>>

export const mindSectionsSchema = z.strictObject(sectionsShape)

export const mindBundleSchema = z.strictObject({
	version: z.literal(MIND_BUNDLE_VERSION),
	exportedAt: z.string().min(1),
	sourceDomiaKey: z.string().min(1),
	sections: mindSectionsSchema,
})

export const mindExportResultSchema = z.object({ bundle: mindBundleSchema })

export const mindSectionReportSchema = z.object({
	cleared: z.number(),
	deferred: z.number(),
	inserted: z.number(),
	matched: z.number(),
	updated: z.number(),
	remapped: z.number(),
	reidentified: z.number(),
	droppedColumns: z.number(),
})

const reportsShape = Object.fromEntries(
	MIND_SECTIONS.map((name) => [name, mindSectionReportSchema.optional()]),
) as Record<MindSection, z.ZodOptional<typeof mindSectionReportSchema>>

export const mindImportReportSchema = z.object({
	mode: mindImportModeSchema,
	sections: z.object(reportsShape),
	preexistingForeignKeyViolations: z.number(),
	sourceDomiaKey: z.string(),
	targetDomiaKey: z.string(),
})

export const mindImportResultSchema = z.object({
	report: mindImportReportSchema,
})

export const mindSectionListSchema = z
	.array(mindSectionNameSchema)
	.min(1)
	.max(MIND_SECTIONS.length)

export const importMindInputSchema = z.object({
	domiaKey: z.string().min(1),
	bundleJson: z.string().min(2),
	mode: mindImportModeSchema,
	sections: mindSectionListSchema.optional(),
})

export const savePersonaTemplateInputSchema = z.object({
	name: z.string().min(1),
	description: z.string(),
	bundleJson: z.string().min(2),
})
