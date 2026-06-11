import { createServerFn } from "@tanstack/react-start"
import { getEmotionsOverview } from "@/services/emotions"

export const getEmotionsOverviewFn = createServerFn({ method: "GET" }).handler(
	() => getEmotionsOverview(),
)
