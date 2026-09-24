export type MeshSecretSlot = "current" | "next"

export type MeshRotateAction = "status" | "restart-grace" | "end-grace"

export type MeshSecretPosture = {
	rotating: boolean
	signingWith: MeshSecretSlot
	accepted: MeshSecretSlot[]
	graceMs: number
	graceEndsAt: string | null
	fingerprints: Record<MeshSecretSlot, string | null>
}

export type MeshRotateResult = MeshSecretPosture & {
	action: MeshRotateAction
}

export type MeshRotateInput = {
	domiaKey: string
	action: MeshRotateAction
}

export type DeleteIdentityDataResult = {
	domiaId: string
	deleted: Record<string, number>
	total: number
	filesDeleted: number
}

export type ResetConversationResult = {
	reset: boolean
}
