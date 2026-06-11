import { createServerFn } from "@tanstack/react-start"
import { getSettingsOverview } from "@/services/settings"

export const getSettingsOverviewFn = createServerFn({ method: "GET" }).handler(
	() => getSettingsOverview(),
)
