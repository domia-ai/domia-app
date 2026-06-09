import { env } from "@/config"
import { getFleetStats } from "@/services/fleet"
import type { FleetStats } from "@/types"

export const getShellData = async (): Promise<{
	stats: FleetStats
	propertyName: string
}> => ({
	stats: await getFleetStats(),
	propertyName: env.DOMIA_APP_PROPERTY_NAME,
})
