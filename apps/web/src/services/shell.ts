import { env } from "@/config"
import { getFleetStats } from "@/services/fleet"
import type { ShellData } from "@/types"

export const getShellData = async (): Promise<ShellData> => ({
	stats: await getFleetStats(),
	propertyName: env.DOMIA_APP_PROPERTY_NAME,
})
