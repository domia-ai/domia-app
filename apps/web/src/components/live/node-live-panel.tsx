import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PresencePulse } from "./presence-pulse"
import { SatelliteDevice } from "./satellite-device"
import { AnnounceControl } from "./announce-control"
import { IntercomControl } from "./intercom-control"
import type { LiveNode } from "@/types/live"

export function NodeLivePanel({ node }: { node: LiveNode }) {
	const nameOf = (key: string) =>
		node.rooms.find((r) => r.domiaKey === key)?.name ?? key

	const devices = node.entries.flatMap((e) =>
		e.satellites
			.filter((s) => s.connected)
			.map((s) => ({ satellite: s, domiaKey: e.domiaKey })),
	)

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between gap-2 space-y-0">
				<CardTitle className="text-base">{node.nodeName}</CardTitle>
				<span className="text-muted-foreground font-mono text-xs">
					{node.nodeId}
				</span>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="space-y-2">
					{node.entries.length === 0 ? (
						<p className="text-muted-foreground text-sm">
							No identities reporting presence.
						</p>
					) : (
						node.entries.map((entry) => (
							<PresencePulse
								key={entry.domiaKey}
								entry={entry}
								name={nameOf(entry.domiaKey)}
								hostDomiaKey={node.hostDomiaKey}
							/>
						))
					)}
				</div>
				{devices.length > 0 ? (
					<>
						<Separator />
						<div className="space-y-2">
							<p className="text-muted-foreground text-xs font-medium uppercase">
								Devices
							</p>
							{devices.map((d) => (
								<SatelliteDevice
									key={`${d.domiaKey}:${d.satellite.satelliteId}`}
									satellite={d.satellite}
									name={nameOf(d.domiaKey)}
								/>
							))}
						</div>
					</>
				) : null}
				<Separator />
				<AnnounceControl hostDomiaKey={node.hostDomiaKey} />
				{node.rooms.length > 1 ? (
					<IntercomControl
						hostDomiaKey={node.hostDomiaKey}
						rooms={node.rooms}
					/>
				) : null}
			</CardContent>
		</Card>
	)
}
