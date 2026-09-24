export type LogLevelType = "error" | "warn" | "info" | "debug" | "success"

export type LogPrefixType = {
	prefix: string
	color: (text: string) => string
}
