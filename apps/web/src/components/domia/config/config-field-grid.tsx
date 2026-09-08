import { ChevronDown } from "lucide-react"
import { m } from "@/paraglide/messages"
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ConfigFieldRow } from "./config-field"
import { cn } from "@/lib/utils"
import type { ConfigDraftApi } from "@/hooks/use-config-draft"
import type { ConfigField, ConfigSectionDef } from "@/types/config"

const fullWidth = (kind: string): boolean => kind === "tags" || kind === "json"

function FieldGrid({
	fields,
	section,
	draft,
	domiaKey,
}: {
	fields: ConfigField[]
	section: ConfigSectionDef
	draft: ConfigDraftApi
	domiaKey: string
}) {
	const values = draft.draft[section.id] ?? {}
	const changed = new Set(draft.changedKeys(section.id))
	return (
		<div className="grid items-start gap-x-4 gap-y-3 sm:grid-cols-2">
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
		</div>
	)
}

export function ConfigFieldGrid({
	section,
	fields,
	draft,
	domiaKey,
	searching,
}: {
	section: ConfigSectionDef
	fields: ConfigField[]
	draft: ConfigDraftApi
	domiaKey: string
	searching: boolean
}) {
	const primary = searching ? fields : fields.filter((f) => !f.advanced)
	const advanced = searching ? [] : fields.filter((f) => f.advanced)
	const advancedChanged = advanced.filter((f) =>
		draft.changedKeys(section.id).includes(f.key),
	).length

	return (
		<div className="space-y-4">
			<FieldGrid
				fields={primary}
				section={section}
				draft={draft}
				domiaKey={domiaKey}
			/>
			{advanced.length > 0 && (
				<Collapsible defaultOpen={advancedChanged > 0}>
					<CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1.5 text-xs outline-none">
						<ChevronDown className="size-3.5 transition-transform group-data-[panel-open]:rotate-180" />
						{m.config_advanced_fields({ count: advanced.length })}
						{advancedChanged > 0 && (
							<span className="bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full text-[10px] font-medium tabular-nums">
								{advancedChanged}
							</span>
						)}
					</CollapsibleTrigger>
					<CollapsibleContent className="pt-3">
						<FieldGrid
							fields={advanced}
							section={section}
							draft={draft}
							domiaKey={domiaKey}
						/>
					</CollapsibleContent>
				</Collapsible>
			)}
		</div>
	)
}
