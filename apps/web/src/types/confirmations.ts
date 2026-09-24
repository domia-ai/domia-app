import type { JsonObject } from "@/types/config"

export type ConfirmationDecision = "yes" | "no"

export type PendingConfirmation = {
	scope: string
	satelliteId: string | null
	tool: string
	args: JsonObject
	resolvedArgs: JsonObject | null
	summary: string | null
	language: string | null
	reasked: boolean
	expiresAt: number
}

export type ConfirmationsResult = {
	confirmations: PendingConfirmation[]
}

export type SettleConfirmationInput = {
	domiaKey: string
	scope: string
	decision: ConfirmationDecision
}

export type SettleConfirmationResult = {
	scope: string
	decision: ConfirmationDecision
	settled: boolean
	ran: boolean
	status: string | null
	text: string | null
}

export type PendingConfirmationsCardProps = {
	domiaKey: string
	online: boolean
}
