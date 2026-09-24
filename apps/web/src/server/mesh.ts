import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import { rotateMesh } from "@/services/mesh"
import { meshRotateInputSchema } from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const meshRotateFn = createServerFn({ method: "POST" })
	.validator(meshRotateInputSchema)
	.handler(({ data }) => {
		if (data.action !== "status") assertWritable()
		return rotateMesh(data)
	})

export const meshPostureQueryOptions = (domiaKey: string) =>
	queryOptions({
		queryKey: ["mesh-posture", domiaKey],
		queryFn: () => meshRotateFn({ data: { domiaKey, action: "status" } }),
		enabled: domiaKey.length > 0,
	})
