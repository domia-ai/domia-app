import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	listNodes,
	getNode,
	createIdentity,
	removeIdentity,
	probeNode,
	addNodeByAddress,
	getNodeConfig,
	updateNodeConfig,
} from "@/services/nodes"
import {
	idSchema,
	nodeIdSchema,
	createIdentityInputSchema,
	removeIdentityInputSchema,
	probeNodeInputSchema,
	nodeConfigUpdateInputSchema,
} from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const listNodesFn = createServerFn({ method: "GET" }).handler(() =>
	listNodes(),
)

export const getNodeFn = createServerFn({ method: "GET" })
	.validator(nodeIdSchema)
	.handler(({ data }) => getNode(data))

export const createIdentityFn = createServerFn({ method: "POST" })
	.validator(createIdentityInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return createIdentity(data)
	})

export const removeIdentityFn = createServerFn({ method: "POST" })
	.validator(removeIdentityInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return removeIdentity(data)
	})

export const getNodeConfigFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => getNodeConfig(data))

export const updateNodeConfigFn = createServerFn({ method: "POST" })
	.validator(nodeConfigUpdateInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return updateNodeConfig(data)
	})

export const nodeConfigQueryOptions = (anchorDomiaKey: string) =>
	queryOptions({
		queryKey: ["node-config", anchorDomiaKey],
		queryFn: () => getNodeConfigFn({ data: anchorDomiaKey }),
		enabled: anchorDomiaKey.length > 0,
	})

export const nodesQueryOptions = () =>
	queryOptions({
		queryKey: ["nodes"],
		queryFn: () => listNodesFn(),
		refetchInterval: 5000,
	})

export const nodeQueryOptions = (nodeId: string) =>
	queryOptions({
		queryKey: ["node", nodeId],
		queryFn: () => getNodeFn({ data: nodeId }),
		refetchInterval: 5000,
	})

export const probeNodeFn = createServerFn({ method: "POST" })
	.validator(probeNodeInputSchema)
	.handler(({ data }) => probeNode(data))

export const addNodeFn = createServerFn({ method: "POST" })
	.validator(probeNodeInputSchema)
	.handler(({ data }) => {
		assertWritable()
		return addNodeByAddress(data)
	})
