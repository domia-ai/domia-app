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
			Read-only · via DB
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
				<CardTitle className="text-base">Persona</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<FieldList
					items={[
						{ label: "Character", value: profile.name },
						{ label: "Personality", value: profile.personality },
						{ label: "Profession", value: profile.profession },
						{ label: "Style", value: profile.communicationStyle },
						{ label: "Perceived age", value: profile.perceivedAge },
						{ label: "Knowledge", value: profile.knowledgeDepth },
						{ label: "Relationship", value: profile.relationshipType },
						{ label: "Role mode", value: profile.roleMode },
						{ label: "Language", value: profile.language },
					]}
				/>
				<div className="space-y-2">
					<p className="text-muted-foreground text-xs">Interests</p>
					<Chips items={profile.interests ?? []} />
				</div>
				<div className="space-y-2">
					<p className="text-muted-foreground text-xs">Hobbies</p>
					<Chips items={profile.hobbies ?? []} />
				</div>
				<div className="space-y-2">
					<p className="text-muted-foreground text-xs">Skills</p>
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
				<CardTitle className="text-base">Mood</CardTitle>
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
				<CardTitle className="text-base">Capabilities</CardTitle>
				<ReadOnlyHint />
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-x-6 gap-y-2">
					{CAPABILITY_ORDER.map((key) => (
						<Pill
							key={key}
							label={CAPABILITY_META[key].label}
							on={Boolean(capabilities[key])}
						/>
					))}
				</div>
				<div className="space-y-1.5">
					<p className="text-muted-foreground text-xs">Delegations</p>
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
							None — runs everything locally.
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
				<CardTitle className="text-base">Engines</CardTitle>
				<ReadOnlyHint />
			</CardHeader>
			<CardContent className="space-y-5">
				{llm && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium">LLM</p>
						<FieldList
							items={[
								{ label: "Engine", value: llm.engine },
								{ label: "Model", value: llm.modelName },
								{ label: "Temperature", value: llm.temperature },
								{ label: "Context window", value: llm.contextWindow },
								{ label: "Max tokens", value: llm.numPredict },
								{ label: "Concurrency", value: llm.llmConcurrency },
							]}
						/>
					</div>
				)}
				{tts && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium">TTS</p>
						<FieldList
							items={[
								{ label: "Engine", value: tts.engine },
								{ label: "Voice", value: tts.voiceName },
								{ label: "Language", value: tts.language },
								{ label: "Speed", value: tts.speed },
							]}
						/>
					</div>
				)}
				{stt && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium">STT</p>
						<FieldList
							items={[
								{ label: "Engine", value: stt.engine },
								{ label: "Model", value: stt.modelName },
								{ label: "Language", value: stt.language },
							]}
						/>
					</div>
				)}
				{wakeword && (
					<div className="space-y-2">
						<p className="text-muted-foreground text-xs font-medium">
							Wake word
						</p>
						<FieldList
							items={[
								{ label: "Engine", value: wakeword.engine },
								{ label: "Keyword", value: wakeword.wakeWord },
								{ label: "Framework", value: wakeword.framework },
							]}
						/>
					</div>
				)}
			</CardContent>
		</Card>
	)
}

const MODULE_FLAGS: { key: keyof ModuleSettings; label: string }[] = [
	{ key: "emotionEngine", label: "Emotion engine" },
	{ key: "emotionCapture", label: "Emotion capture" },
	{ key: "memoryEngine", label: "Memory engine" },
	{ key: "factCapture", label: "Fact capture" },
	{ key: "factRecall", label: "Fact recall" },
	{ key: "collectiveMind", label: "Collective mind" },
	{ key: "narrativeEngine", label: "Narrative engine" },
	{ key: "identityEngine", label: "Identity engine" },
	{ key: "remoteAccessEngine", label: "Remote access" },
	{ key: "reflectionOnlyWhenIdle", label: "Reflect when idle" },
]

export function ModulesCard({ modules }: { modules: ModuleSettings }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">Modules</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="grid grid-cols-2 gap-x-6 gap-y-2">
					{MODULE_FLAGS.map((flag) => (
						<Pill
							key={flag.key}
							label={flag.label}
							on={Boolean(modules[flag.key])}
						/>
					))}
				</div>
				<FieldList
					items={[
						{
							label: "Reflection concurrency",
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
				<CardTitle className="text-base">Skills</CardTitle>
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
						No skill providers configured.
					</p>
				)}
			</CardContent>
		</Card>
	)
}
