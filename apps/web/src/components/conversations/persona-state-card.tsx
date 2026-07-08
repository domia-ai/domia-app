import { m } from "@/paraglide/messages"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MoodRadar } from "@/components/domia/mood-radar"
import { accentFor } from "@/utils/accent"
import type {
	DomiaSnapshot,
	PersonaStateCardProps,
} from "@/types/conversations"

export function PersonaStateCard({ trace }: PersonaStateCardProps) {
	const snapshot = trace.domiaSnapshot as DomiaSnapshot | null
	const emotion = snapshot?.emotion ?? null
	const character = snapshot?.character ?? null
	if (!snapshot) return null

	const chips = character
		? [
				character.personality,
				character.profession,
				character.communicationStyle,
				character.perceivedAge,
			].filter((v): v is string => Boolean(v))
		: []

	const config = [
		snapshot.stt?.modelName && `STT ${snapshot.stt.modelName}`,
		snapshot.llm?.modelName && `LLM ${snapshot.llm.modelName}`,
		snapshot.tts?.engine && `TTS ${snapshot.tts.engine}`,
		snapshot.tts?.voiceName && `voice ${snapshot.tts.voiceName}`,
	].filter((v): v is string => Boolean(v))

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-base">{m.conv_domia_state()}</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{emotion && (
					<div className="flex justify-center">
						<MoodRadar
							emotion={emotion}
							accent={accentFor(trace.sourceDomiaKey)}
						/>
					</div>
				)}
				{character?.name && (
					<p className="text-sm font-medium">{character.name}</p>
				)}
				{chips.length > 0 && (
					<div className="flex flex-wrap gap-1.5">
						{chips.map((chip, i) => (
							<Badge key={`${chip}-${i}`} variant="secondary">
								{chip}
							</Badge>
						))}
					</div>
				)}
				{config.length > 0 && (
					<div className="text-muted-foreground space-y-0.5 border-t pt-2 font-mono text-[11px]">
						{config.map((line) => (
							<p key={line}>{line}</p>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}
