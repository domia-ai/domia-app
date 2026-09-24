import type { z } from "zod"
import type { MIND_SECTIONS } from "@/constants/mind-transfer"
import type {
	mindBundleSchema,
	mindImportModeSchema,
	mindImportReportSchema,
	mindSectionDataSchema,
	mindSectionReportSchema,
} from "@/schemas/mind-transfer"

export type MindSection = (typeof MIND_SECTIONS)[number]

export type MindImportMode = z.infer<typeof mindImportModeSchema>

export type MindSectionData = z.infer<typeof mindSectionDataSchema>

export type MindBundle = z.infer<typeof mindBundleSchema>

export type MindSectionReport = z.infer<typeof mindSectionReportSchema>

export type MindImportReport = z.infer<typeof mindImportReportSchema>

export type MindSectionCountKey = keyof MindSectionReport

export type MindImportBody = {
	bundle: MindBundle
	mode: MindImportMode
	sections?: MindSection[]
}

export type MindExportInput = {
	domiaKey: string
	sections?: MindSection[]
}

export type MindImportInput = {
	domiaKey: string
	bundleJson: string
	mode: MindImportMode
	sections?: MindSection[]
}

export type SavePersonaTemplateInput = {
	name: string
	description: string
	bundleJson: string
}

export type MindTransferCardProps = {
	domiaKey: string
	domiaName: string
	online: boolean
}

export type MindSectionChecklistProps = {
	available: readonly MindSection[]
	selected: MindSection[]
	counts?: Partial<Record<MindSection, number>>
	disabled?: boolean
	onToggle: (section: MindSection) => void
}

export type MindImportReportViewProps = {
	report: MindImportReport
}
