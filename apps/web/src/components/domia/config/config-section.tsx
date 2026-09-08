import { Sparkles } from "lucide-react"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import { HealthPanel } from "../health-panel"
import { ModelsManager } from "../models-manager"
import { ConfigFieldGrid } from "./config-field-grid"
import { ConfigSkillProviders } from "./config-skill-providers"
import { SkillsHealthPanel } from "../skills-health-panel"
import { BenchHealthPanel } from "../bench-health-panel"
import { ARCHETYPE_PRESETS } from "@/constants/config"
import { fieldMatches } from "@/utils/config-schema"
import type { ConfigDraftApi } from "@/hooks/use-config-draft"
import type { ConfigSectionDef, FieldValue } from "@/types/config"

export function ConfigSection({
	domiaKey,
	section,
	draft,
	online,
	search,
}: {
	domiaKey: string
	section: ConfigSectionDef
	draft: ConfigDraftApi
	online: boolean
	search: string
}) {
	const header = (
		<div className="space-y-1">
			<h2 className="text-lg font-semibold">{section.label()}</h2>
			{section.description && (
				<p className="text-muted-foreground text-sm">{section.description()}</p>
			)}
		</div>
	)

	if (section.kind === "diagnostics")
		return (
			<div className="space-y-4">
				{header}
				<HealthPanel domiaKey={domiaKey} online={online} enabled />
				<BenchHealthPanel domiaKey={domiaKey} online={online} />
			</div>
		)

	if (section.kind === "models")
		return (
			<div className="space-y-4">
				{header}
				<ModelsManager domiaKey={domiaKey} online={online} enabled />
			</div>
		)

	if (section.kind === "skill")
		return (
			<div className="space-y-4">
				{header}
				<SkillsHealthPanel domiaKey={domiaKey} online={online} enabled />
				<ConfigSkillProviders draft={draft} domiaKey={domiaKey} />
			</div>
		)

	const query = search.trim().toLowerCase()
	const fields = query
		? section.fields.filter((f) => fieldMatches(f, query))
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
							title={preset.description()}
							onClick={() =>
								draft.setSectionValues(
									section.id,
									preset.capabilities as Record<string, FieldValue>,
								)
							}
						>
							<Sparkles className="size-3.5" />
							{preset.label()}
						</Button>
					))}
				</div>
			)}

			{fields.length === 0 ? (
				<p className="text-muted-foreground text-sm">
					{m.config_no_settings_match({ query: search })}
				</p>
			) : (
				<ConfigFieldGrid
					section={section}
					fields={fields}
					draft={draft}
					domiaKey={domiaKey}
					searching={query !== ""}
				/>
			)}
		</div>
	)
}
