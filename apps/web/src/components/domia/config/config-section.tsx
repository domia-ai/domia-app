import { Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { HealthPanel } from "../health-panel"
import { ModelsManager } from "../models-manager"
import { ConfigFieldRow } from "./config-field"
import { MoodRadarEditor } from "./mood-radar-editor"
import { ARCHETYPE_PRESETS } from "@/constants/config"
import { cn } from "@/lib/utils"
import type { ConfigDraftApi } from "@/hooks/use-config-draft"
import type { ConfigSectionDef, FieldValue } from "@/types/config"

const fullWidth = (kind: string): boolean =>
	kind === "boolean" || kind === "tags" || kind === "model"

export function ConfigSection({
	domiaKey,
	section,
	draft,
	online,
	accent,
	search,
}: {
	domiaKey: string
	section: ConfigSectionDef
	draft: ConfigDraftApi
	online: boolean
	accent: string
	search: string
}) {
	const header = (
		<div className="space-y-1">
			<h2 className="text-lg font-semibold">{section.label}</h2>
			{section.description && (
				<p className="text-muted-foreground text-sm">{section.description}</p>
			)}
		</div>
	)

	if (section.kind === "diagnostics")
		return (
			<div className="space-y-4">
				{header}
				<HealthPanel domiaKey={domiaKey} online={online} enabled />
			</div>
		)

	if (section.kind === "models")
		return (
			<div className="space-y-4">
				{header}
				<ModelsManager domiaKey={domiaKey} online={online} enabled />
			</div>
		)

	const values = draft.draft[section.id] ?? {}
	const changed = new Set(draft.changedKeys(section.id))

	if (section.kind === "radar")
		return (
			<div className="space-y-4">
				{header}
				<MoodRadarEditor
					fields={section.fields}
					values={values}
					accent={accent}
					onChange={(key, v) => draft.setField(section.id, key, v)}
				/>
			</div>
		)

	const query = search.trim().toLowerCase()
	const fields = query
		? section.fields.filter((f) => f.label.toLowerCase().includes(query))
		: section.fields

	return (
		<div className="space-y-4">
			{header}

			{section.id === "capabilities" && !query && (
				<div className="flex flex-wrap gap-2">
					{ARCHETYPE_PRESETS.map((preset) => (
						<Button
							key={preset.id}
							type="button"
							variant="outline"
							size="sm"
							title={preset.description}
							onClick={() =>
								draft.setSectionValues(
									section.id,
									preset.capabilities as Record<string, FieldValue>,
								)
							}
						>
							<Sparkles className="size-3.5" />
							{preset.label}
						</Button>
					))}
				</div>
			)}

			<div className="grid gap-4 sm:grid-cols-2">
				{fields.map((field) => (
					<div
						key={field.key}
						className={cn(fullWidth(field.kind) && "sm:col-span-2")}
					>
						<ConfigFieldRow
							field={field}
							value={values[field.key] ?? ""}
							changed={changed.has(field.key)}
							domiaKey={domiaKey}
							error={draft.fieldError(section.id, field.key)}
							onChange={(v) => draft.setField(section.id, field.key, v)}
						/>
					</div>
				))}
				{fields.length === 0 && (
					<p className="text-muted-foreground col-span-2 text-sm">
						No settings match “{search}”.
					</p>
				)}
			</div>
		</div>
	)
}
