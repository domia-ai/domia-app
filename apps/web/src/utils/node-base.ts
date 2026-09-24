import type { HttpScheme, NodeEndpoint } from "@/types/nodes"

export const asHttpScheme = (raw: string | null | undefined): HttpScheme =>
	raw === "https" ? "https" : "http"

export const nodeBaseUrl = (endpoint: NodeEndpoint): string =>
	`${endpoint.httpScheme}://${endpoint.localIp}:${endpoint.httpPort}`

export const nodeWsUrl = (endpoint: NodeEndpoint, path: string): string =>
	`${endpoint.httpScheme === "https" ? "wss" : "ws"}://${endpoint.localIp}:${endpoint.httpPort}${path}`
