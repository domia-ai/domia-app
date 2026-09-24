import {
	SKILL_RISK_CLASS_ORDER,
	SKILL_TOOL_POLICY_ORDER,
} from "@/constants/skills"
import type {
	SkillProviderPayload,
	SkillProviderStatus,
	SkillToolPayload,
	SkillToolView,
	SkillsStatusPayload,
	SkillsStatusResult,
} from "@/types/skills"

const toToolView = (tool: SkillToolPayload): SkillToolView => ({
	rawName: tool.rawName,
	namespacedName: tool.namespacedName,
	displayName: tool.rawName,
	riskClass: tool.riskClass ?? null,
	policy: tool.policy ?? null,
	fromDescriptor: tool.policySource === "descriptor",
	hidden: tool.hidden === true,
})

const compareTools = (a: SkillToolView, b: SkillToolView): number => {
	const policy =
		SKILL_TOOL_POLICY_ORDER[a.policy ?? "allow"] -
		SKILL_TOOL_POLICY_ORDER[b.policy ?? "allow"]
	if (policy !== 0) return policy
	const risk =
		SKILL_RISK_CLASS_ORDER[a.riskClass ?? "read"] -
		SKILL_RISK_CLASS_ORDER[b.riskClass ?? "read"]
	if (risk !== 0) return risk
	return a.displayName.localeCompare(b.displayName)
}

const toProviderStatus = (
	provider: SkillProviderPayload,
): SkillProviderStatus => {
	const tools = (provider.tools ?? []).map(toToolView).sort(compareTools)
	return {
		id: provider.id,
		name: provider.name,
		kind: provider.kind ?? null,
		trustTier: provider.trustTier ?? null,
		connected: provider.connected,
		cachedTools: provider.cachedTools,
		allowedTools: provider.allowedTools,
		lastSyncAt: provider.lastSyncAt ?? null,
		specialization: provider.specialization ?? null,
		tools,
		confirmTools: tools.filter((tool) => tool.policy === "confirm").length,
		blockedTools: tools.filter((tool) => tool.policy === "block").length,
		hiddenTools: tools.filter((tool) => tool.hidden).length,
	}
}

export const toSkillsStatusResult = (
	payload: SkillsStatusPayload,
): SkillsStatusResult => ({
	skillsEngine: payload.skillsEngine,
	builtinTools: payload.builtinTools,
	providers: payload.providers.map(toProviderStatus),
})
