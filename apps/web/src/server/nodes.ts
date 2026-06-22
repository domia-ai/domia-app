import { queryOptions } from "@tanstack/react-query"
import { createServerFn } from "@tanstack/react-start"
import {
	listNodes,
	getNode,
	listIdentities,
	createIdentity,
	removeIdentity,
} from "@/services/nodes"
import {
	idSchema,
	nodeIdSchema,
	createIdentityInputSchema,
	removeIdentityInputSchema,
} from "@/schemas/server"
import { assertWritable } from "@/lib/demo"

export const listNodesFn = createServerFn({ method: "GET" }).handler(() =>
	listNodes(),
)

export const getNodeFn = createServerFn({ method: "GET" })
	.validator(nodeIdSchema)
	.handler(({ data }) => getNode(data))

export const listIdentitiesFn = createServerFn({ method: "GET" })
	.validator(idSchema)
	.handler(({ data }) => listIdentities(data))

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

export const identitiesQueryOptions = (anchorDomiaKey: string) =>
	queryOptions({
		queryKey: ["identities", anchorDomiaKey],
		queryFn: () => listIdentitiesFn({ data: anchorDomiaKey }),
	})
