import { SatellitesPanel } from "@/components/nodes/satellites-panel"
import { isOnline } from "@/utils/presence"
import type { MeshDomiaRow } from "@/types/fleet"
import type { IdentityRole, NodeIdentitySummary } from "@/types/nodes"

const roleOf = (isHosted: boolean, isPrincipal: boolean): IdentityRole =>
	isPrincipal ? "principal" : isHosted ? "hosted" : "peer"

export function DomiaSatellites({ domia }: { domia: MeshDomiaRow }) {
	if (!domia.isHosted || !domia.localIp || !domia.httpPort) return null

	const nodeId = domia.nodeId ?? `${domia.localIp}-${domia.httpPort}`
	const identity: NodeIdentitySummary = {
		domiaKey: domia.domiaKey,
		name: domia.name,
		avatarId: domia.avatarId,
		isHosted: domia.isHosted,
		isPrincipal: domia.isPrincipal,
		role: roleOf(domia.isHosted, domia.isPrincipal),
		online: isOnline(domia.lastSeenAt),
		lastSeenAt: domia.lastSeenAt,
	}

	return (
		<SatellitesPanel
			anchorDomiaKey={domia.domiaKey}
			nodeId={nodeId}
			hosted={[identity]}
		/>
	)
}
