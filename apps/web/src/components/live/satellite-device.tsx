import { HardDrive } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { SatellitePresence, SatelliteProtocol } from "@/types/rooms"

const protocolLabel: Record<SatelliteProtocol, string> = {
	native: "Native",
	wyoming: "Wyoming",
	esphome: "ESPHome",
}

export function SatelliteDevice({
	satellite,
	name,
}: {
	satellite: SatellitePresence
	name: string
}) {
	return (
		<div className="flex items-center gap-2 text-sm">
			<HardDrive className="text-muted-foreground size-4" />
			<span className="font-mono text-xs">{satellite.satelliteId}</span>
			<span className="text-muted-foreground text-xs">→ {name}</span>
			<Badge variant="outline" className="ml-auto text-xs">
				{protocolLabel[satellite.protocol]}
			</Badge>
		</div>
	)
}
