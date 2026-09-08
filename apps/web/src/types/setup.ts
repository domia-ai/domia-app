export type SetupStepId =
	| "name"
	| "template"
	| "home-assistant"
	| "satellite"
	| "verify"

export type SetupReason = "default-name" | "no-persona" | "no-capabilities"

export type SetupCandidate = {
	domiaKey: string
	name: string
	online: boolean
	localIp: string | null
	httpPort: number | null
	reasons: SetupReason[]
}

export type SetupTarget = {
	domiaKey: string
	name: string
	online: boolean
	fresh: boolean
}

export type SetupCheckStatus = "ok" | "warn" | "fail"

export type SetupCheckId =
	| "health"
	| "identity"
	| "engines"
	| "skills"
	| "satellites"

export type SetupCheck = {
	id: SetupCheckId
	status: SetupCheckStatus
	detail: string | null
	error: string | null
}

export type SetupVerification = {
	domiaKey: string
	name: string
	checks: SetupCheck[]
}

export type SetupNameInput = {
	domiaKey: string
	name: string
}

export type PairHomeAssistantInput = {
	domiaKey: string
	url: string
	token: string
	name?: string
}
