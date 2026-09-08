import type { SetupStepId } from "@/types/setup"

export const DEFAULT_NODE_NAME = "Domia"

export const HOME_ASSISTANT_PROVIDER_NAME = "home-assistant"

export const SETUP_STEPS: readonly SetupStepId[] = [
	"name",
	"template",
	"home-assistant",
	"satellite",
	"verify",
]
