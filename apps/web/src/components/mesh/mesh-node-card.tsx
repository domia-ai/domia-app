import { Link } from "@tanstack/react-router"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { PersonaAvatar } from "@/components/domia/persona-avatar"
import { CapabilityChip } from "./capability-chip"
import type { MeshNode } from "@/types/mesh"

export function MeshNodeCard({ node }: { node: MeshNode }) {
	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
				<CardTitle className="text-base">{node.nodeName}</CardTitle>
				<span className="text-muted-foreground font-mono text-xs">
					{node.nodeId}
				</span>
			</CardHeader>
			<CardContent className="space-y-3">
				{node.identities.map((identity) => (
					<Link
						key={identity.domiaKey}
						to="/domias/$key"
						params={{ key: identity.domiaKey }}
						className="hover:bg-muted/50 -mx-2 flex items-center gap-2 rounded px-2 py-1.5"
					>
						<PersonaAvatar
							domiaKey={identity.domiaKey}
							name={identity.name}
							avatarId={null}
							size="sm"
						/>
						<span className="flex-1 truncate text-sm font-medium">
							{identity.name}
						</span>
						{identity.isPrincipal ? (
							<Badge variant="secondary" className="text-[10px]">
								principal
							</Badge>
						) : null}
						<div className="flex gap-1">
							<CapabilityChip capability="STT" local={identity.caps.stt} />
							<CapabilityChip capability="LLM" local={identity.caps.llm} />
							<CapabilityChip capability="TTS" local={identity.caps.tts} />
						</div>
					</Link>
				))}
			</CardContent>
		</Card>
	)
}
