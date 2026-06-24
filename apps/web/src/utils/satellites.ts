import type {
	SatelliteNumberEntity,
	SatelliteNumberGroup,
} from "@/types/satellites"

const BUCKET_ORDER = ["Wake word", "Microphone", "Noise", "Advanced"] as const

const bucketFor = (entity: SatelliteNumberEntity): string => {
	const hay = `${entity.name} ${entity.id}`.toLowerCase()
	if (hay.includes("wake") || hay.includes("sensitivity")) return "Wake word"
	if (hay.includes("mic") || hay.includes("gain") || hay.includes("volume"))
		return "Microphone"
	if (hay.includes("noise")) return "Noise"
	return "Advanced"
}

export const groupSatelliteNumbers = (
	entities: SatelliteNumberEntity[],
): SatelliteNumberGroup[] => {
	const byLabel = new Map<string, SatelliteNumberEntity[]>()
	for (const entity of entities) {
		const label = bucketFor(entity)
		const list = byLabel.get(label)
		if (list) list.push(entity)
		else byLabel.set(label, [entity])
	}
	const order = (label: string): number => {
		const idx = BUCKET_ORDER.indexOf(label as (typeof BUCKET_ORDER)[number])
		return idx === -1 ? BUCKET_ORDER.length : idx
	}
	return [...byLabel.entries()]
		.map(([label, list]) => ({ label, entities: list }))
		.sort((a, b) => order(a.label) - order(b.label))
}
