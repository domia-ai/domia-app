import { env } from "@/config"

export const meshHeaders = (): Record<string, string> => ({
	authorization: `Bearer ${env.DOMIA_MESH_SECRET}`,
})
