import { clientEnv } from "@/config/client"

export const isDemoMode = (): boolean => clientEnv.VITE_DOMIA_APP_DEMO_MODE

export const assertWritable = (): void => {
	if (isDemoMode()) {
		throw new Error("Demo is read-only")
	}
}
