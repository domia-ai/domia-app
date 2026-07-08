import { m } from "@/paraglide/messages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CAPABILITY_META, CAPABILITY_ORDER } from "@/constants/capabilities"
import { MoodRadar } from "./mood-radar"
import type {
	CapabilityDelegation,
	CharacterProfile,
	EmotionState,
	LlmModelConfig,
	SkillProviderConfig,
	ModuleSettings,
	RuntimeCapabilities,
	SttConfig,
	TtsConfig,
	WakeWordConfig,
} from "@/types"

function FieldList({
	items,
}: {
	items: { label: string; value: string | number | null | undefined }[]
}) {
	return (
		<dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
			{items.map((item) => (
				<div key={item.label} className="contents">
					<dt className="text-muted-foreground">{item.label}</dt>
					<dd className="text-right font-medium tabular-nums">
						{item.value ?? "—"}
					</dd>
				</div>
			))}
		</dl>
	)
}

function Chips({ items }: { items: string[] }) {
	if (!items.length)
		return <span className="text-muted-foreground text-sm">—</span>
	return (
		<div className="flex flex-wrap gap-1.5">
			{items.map((item) => (
				<Badge key={item} variant="secondary" className="font-normal">
					{item}
				</Badge>
			))}
		</div>
	)
}

function ReadOnlyHint() {
	return (
		<Badge
			variant="outline"
			className="text-muted-foreground text-[10px] font-normal"
		>
			{m.domia_readonly_db()}
		</Badge>
	)
}

function Pill({ label, on }: { label: string; on: boolean }) {
	return (
		<div className="flex items-center gap-2 text-sm">
			<span
				className={cn(
					"size-2 rounded-full",
					on ? "bg-emerald-500" : "bg-muted-foreground/30",
				)}
			/>
			<span className={cn(!on && "text-muted-foreground")}>{label}</span>
		</div>
	)
}

export function PersonaCard({ profile }: { profile: CharacterProfile }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{m.domia_persona_title()}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<FieldList
					items={[
						{ label: m.domia_field_character(), value: profile.name },
						{ label: m.mind_field_personality(), value: profile.personality },
						{ label: m.mind_field_profession(), value: profile.profession },
						{ label: m.domia_field_style(), value: profile.communicationStyle },
						{
							label: m.mind_field_perceived_age(),
							value: profile.perceivedAge,
						},
						{ label: m.domia_field_knowledge(), value: profile.knowledgeDepth },
						{
							label: m.mind_field_relationship(),
							value: profile.relationshipType,
						},
						{ label: m.mind_field_role_mode(), value: profile.roleMode },
						{ label: m.config_field_language(), value: profile.language },
					]}
				/>
				<div className="space-y-2">
					<p className="text-muted-foreground text-xs">
						{m.mind_field_interests()}
					</p>
					<Chips items={profile.interests ?? []} />
				</div>
				<div className="space-y-2">
					<p className="text-muted-foreground text-xs">
						{m.mind_field_hobbies()}
					</p>
					<Chips items={profile.hobbies ?? []} />
				</div>
				<div className="space-y-2">
					<p className="text-muted-foreground text-xs">
						{m.mind_field_skills()}
					</p>
					<Chips items={profile.skills ?? []} />
				</div>
			</CardContent>
		</Card>
	)
}

export function MoodCard({
	emotion,
	accent,
}: {
	emotion: EmotionState
	accent: string
}) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{m.domia_mood_title()}</CardTitle>
			</CardHeader>
			<CardContent>
				<MoodRadar emotion={emotion} accent={accent} />
			</CardContent>
		</Card>
	)
}

export function CapabilitiesCard({
	capabilities,
	delegations,
}: {
	capabilities: RuntimeCapabilities
	delegations: CapabilityDelegation[]
}) {
	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0">
				<CardTitle className="text-base">
					{m.domia_capabilities_title()}
				</CardTitle>
				<ReadOnlyHint />
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-x-6 gap-y-2">
					{CAPABILITY_ORDER.map((key) => (
						<Pill
							key={key}
							label={CAPABILITY_META[key].label()}
							on={Boolean(capabilities[key])}
						/>
					))}
				</div>
				<div className="space-y-1.5">
					<p className="text-muted-foreground text-xs">
						{m.domia_delegations()}
					</p>
					{delegations.length ? (
						<div className="flex flex-wrap gap-1.5">
							{delegations.map((d) => (
								<Badge
									key={`${d.capability}-${d.targetDomiaKey}`}
									variant="outline"
									className="font-mono text-xs"
								>
									{d.capability} → {d.targetDomiaKey}
								</Badge>
							))}
						</div>
					) : (
						<p className="text-muted-foreground text-sm">
							{m.domia_delegations_none()}
						</p>
					)}
				</div>
			</CardContent>
		</Card>
	)
}

export function EnginesCard({
	llm,
	tts,
	stt,
	wakeword,
}: {
	llm: LlmModelConfig | null
	tts: TtsConfig | null
	stt: SttConfig | null
	wakeword: WakeWordConfig | null
}) {
	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0">
				<CardTitle className="text-base">{m.domia_engines_title()}</CardTitle>
				<ReadOnlyHint />
			</CardHeader>
			<CardContent className="space-y-5">
				{llm && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium">LLM</p>
						<FieldList
							items={[
								{ label: m.config_field_engine(), value: llm.engine },
								{ label: m.config_field_model(), value: llm.modelName },
								{ label: m.domia_field_temperature(), value: llm.temperature },
								{
									label: m.config_field_context_window(),
									value: llm.contextWindow,
								},
								{ label: m.domia_field_max_tokens(), value: llm.numPredict },
								{
									label: m.config_field_concurrency(),
									value: llm.llmConcurrency,
								},
							]}
						/>
					</div>
				)}
				{tts && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium">TTS</p>
						<FieldList
							items={[
								{ label: m.config_field_engine(), value: tts.engine },
								{ label: m.config_field_voice(), value: tts.voiceName },
								{ label: m.config_field_language(), value: tts.language },
								{ label: m.config_field_speed(), value: tts.speed },
							]}
						/>
					</div>
				)}
				{stt && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium">STT</p>
						<FieldList
							items={[
								{ label: m.config_field_engine(), value: stt.engine },
								{ label: m.config_field_model(), value: stt.modelName },
								{ label: m.config_field_language(), value: stt.language },
							]}
						/>
					</div>
				)}
				{wakeword && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium">
							{m.enum_capability_wakeword()}
						</p>
						<FieldList
							items={[
								{ label: m.config_field_engine(), value: wakeword.engine },
								{ label: m.config_field_keyword(), value: wakeword.wakeWord },
								{ label: m.domia_field_framework(), value: wakeword.framework },
							]}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

const MODULE_FLAGS: { key: keyof ModuleSettings; label: () => string }[] = [
	{ key: "emotionEngine", label: m.mind_module_emotion_engine },
	{ key: "emotionCapture", label: m.config_field_emotion_capture },
	{ key: "memoryEngine", label: m.mind_module_memory_engine },
	{ key: "factCapture", label: m.config_field_fact_capture },
	{ key: "factRecall", label: m.config_field_fact_recall },
	{ key: "collectiveMind", label: m.mind_module_collective_mind },
	{ key: "narrativeEngine", label: m.mind_module_narrative_engine },
	{ key: "identityEngine", label: m.mind_module_identity_engine },
	{ key: "remoteAccessEngine", label: m.mind_module_remote_access },
	{ key: "reflectionOnlyWhenIdle", label: m.config_field_reflect_only_idle },
]

export function ModulesCard({ modules }: { modules: ModuleSettings }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{m.domia_modules_title()}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-x-6 gap-y-2">
					{MODULE_FLAGS.map((flag) => (
						<Pill
							key={flag.key}
							label={flag.label()}
							on={Boolean(modules[flag.key])}
						/>
					))}
				</div>
				<FieldList
					items={[
						{
							label: m.config_field_reflection_concurrency(),
							value: modules.reflectionConcurrency,
						},
					]}
				/>
			</CardContent>
		</Card>
	)
}

export function SkillsCard({ servers }: { servers: SkillProviderConfig[] }) {
	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between space-y-0">
				<CardTitle className="text-base">{m.mind_field_skills()}</CardTitle>
				<ReadOnlyHint />
			</CardHeader>
			<CardContent>
				{servers.length ? (
					<div className="flex flex-wrap gap-1.5">
						{servers.map((server) => (
							<Badge
								key={server.name}
								variant={server.enabled === false ? "outline" : "secondary"}
							>
								{server.name}
							</Badge>
						))}
					</div>
				) : (
					<p className="text-muted-foreground text-sm">
						{m.domia_skills_none()}
					</p>
				)}
			</CardContent>
		</Card>
	)
}
