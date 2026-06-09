import { createServerFn } from "@tanstack/react-start"
import { getAnalytics } from "@/services/analytics"

export const getAnalyticsFn = createServerFn({ method: "GET" }).handler(() =>
	getAnalytics(),
)
