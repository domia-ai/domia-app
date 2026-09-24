import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { getToolRuns } from "@/services/tool-runs"
import { toolRunsInputSchema } from "@/schemas/server"

export const getToolRunsFn = createServerFn({ method: "GET" })
	.validator(toolRunsInputSchema)
	.handler(({ data }) => getToolRuns(data))

export const toolRunsQueryOptions = (domiaKey: string, interactionId: string) =>
	queryOptions({
		queryKey: ["tool-runs", domiaKey, interactionId],
		queryFn: () => getToolRunsFn({ data: { domiaKey, interactionId } }),
		retry: false,
	})
