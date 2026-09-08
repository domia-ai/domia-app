import { and, eq } from "drizzle-orm"
import { domiaRegistry } from "@domia-app/db"
import { db } from "@/db"
import { env } from "@/config"
import { isOnline } from "@/utils/presence"
import { parseConfigSnapshot } from "@/utils/config"
import { resolveNodeBase } from "@/services/fleet"
import { getConfig, importConfig } from "@/services/config"
import {
	normalizeSkillProviders,
	skillProviderToBundle,
} from "@/utils/skill-providers"
import { CAPABILITY_KEYS } from "@/constants/capabilities"
import { SKILL_PRESETS } from "@/constants/skill-presets"
import {
	DEFAULT_NODE_NAME,
	HOME_ASSISTANT_PROVIDER_NAME,
} from "@/constants/setup"
import {
	nodeGetConfigHealth,
	nodeGetSkills,
	nodeListIdentities,
	nodeListSatellites,
	nodeProbeHealth,
} from "@/lib/node-client"
import type { ActionResult } from "@/types"
import type { ConfigImportResult, SkillProviderDraft } from "@/types/config"
import type {
	PairHomeAssistantInput,
	SetupCandidate,
	SetupCheck,
	SetupNameInput,
	SetupReason,
	SetupTarget,
	SetupVerification,
} from "@/types/setup"

const reasonsFor = (
	name: string,
	configSnapshotJson: string | null,
): SetupReason[] => {
	const config = parseConfigSnapshot(configSnapshotJson)
	const reasons: SetupReason[] = []
	if (name.trim() === DEFAULT_NODE_NAME) reasons.push("default-name")
	if (!config.characterProfile) reasons.push("no-persona")
	const caps = config.runtimeCapabilities
	if (caps && !CAPABILITY_KEYS.some((k) => caps[k] === true))
		reasons.push("no-capabilities")
	return reasons
}

const hostedRows = () =>
	db
		.select({
			domiaKey: domiaRegistry.domiaKey,
			name: domiaRegistry.name,
			localIp: domiaRegistry.localIp,
			httpPort: domiaRegistry.httpPort,
			lastSeenAt: domiaRegistry.lastSeenAt,
			configSnapshotJson: domiaRegistry.configSnapshotJson,
		})
		.from(domiaRegistry)
		.where(
			and(eq(domiaRegistry.isActive, true), eq(domiaRegistry.isHosted, true)),
		)
		.all()

export const listSetupCandidates = async (): Promise<SetupCandidate[]> =>
	hostedRows()
		.map((r) => ({
			domiaKey: r.domiaKey,
			name: r.name,
			online: isOnline(r.lastSeenAt),
			localIp: r.localIp,
			httpPort: r.httpPort,
			reasons: reasonsFor(r.name, r.configSnapshotJson),
		}))
		.filter((c) => c.reasons.length > 0)
		.sort((a, b) => Number(b.online) - Number(a.online))

export const listSetupTargets = async (): Promise<SetupTarget[]> =>
	hostedRows()
		.map((r) => ({
			domiaKey: r.domiaKey,
			name: r.name,
			online: isOnline(r.lastSeenAt),
			fresh: reasonsFor(r.name, r.configSnapshotJson).length > 0,
		}))
		.sort(
			(a, b) =>
				Number(b.online) - Number(a.online) ||
				Number(b.fresh) - Number(a.fresh),
		)

export const setSetupName = (
	input: SetupNameInput,
): Promise<ActionResult<ConfigImportResult>> => {
	const [row] = db
		.select({ configSnapshotJson: domiaRegistry.configSnapshotJson })
		.from(domiaRegistry)
		.where(eq(domiaRegistry.domiaKey, input.domiaKey))
		.limit(1)
		.all()
	const hasCharacter = !!parseConfigSnapshot(row?.configSnapshotJson ?? null)
		.characterProfile
	const name = input.name.trim()
	return importConfig({
		domiaKey: input.domiaKey,
		bundle: {
			domia: { name },
			...(hasCharacter ? { character: { name } } : {}),
		},
	})
}

const homeAssistantDraft = (
	input: PairHomeAssistantInput,
): SkillProviderDraft => {
	const preset =
		SKILL_PRESETS.find((p) => p.id === HOME_ASSISTANT_PROVIDER_NAME)?.draft ??
		{}
	return {
		id: "",
		name: input.name?.trim() || HOME_ASSISTANT_PROVIDER_NAME,
		protocol: "mcp",
		type: "http",
		url: input.url.trim(),
		authKind: "bearer",
		token: input.token.trim(),
		headers: "",
		whitelist: preset.whitelist ?? [],
		config: preset.config ?? "",
		descriptor: preset.descriptor ?? {
			version: 1,
			kind: HOME_ASSISTANT_PROVIDER_NAME,
		},
	}
}

export const pairHomeAssistant = async (
	input: PairHomeAssistantInput,
): Promise<ActionResult<ConfigImportResult>> => {
	const current = await getConfig(input.domiaKey)
	if (!current.ok) return { ok: false, error: current.error }
	if (!current.data) return { ok: false, error: "Config unavailable" }
	const next = homeAssistantDraft(input)
	const existing = normalizeSkillProviders(current.data.skillProviders)
	const previous = existing.find(
		(p) => p.name === next.name || p.url === next.url,
	)
	if (previous) next.id = previous.id
	const others = existing.filter((p) => p !== previous)
	return importConfig({
		domiaKey: input.domiaKey,
		bundle: {
			modules: { skillsEngine: true },
			skillProviders: [...others, next].map(skillProviderToBundle),
		},
	})
}

const check = (
	id: SetupCheck["id"],
	status: SetupCheck["status"],
	detail: string | null = null,
	error: string | null = null,
): SetupCheck => ({ id, status, detail, error })

const settle = async <T>(
	p: Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> => {
	try {
		return { ok: true, value: await p }
	} catch (err) {
		return {
			ok: false,
			error: err instanceof Error ? err.message : "request failed",
		}
	}
}

export const verifySetup = async (
	domiaKey: string,
): Promise<ActionResult<SetupVerification>> => {
	const base = await resolveNodeBase(domiaKey)
	if (!base.ok) return base
	const [health, identities, configHealth, skills, satellites] =
		await Promise.all([
			settle(nodeProbeHealth(base.data, env.DOMIA_NODE_PROBE_TIMEOUT_MS)),
			settle(nodeListIdentities(base.data)),
			settle(nodeGetConfigHealth(base.data, domiaKey)),
			settle(nodeGetSkills(base.data, domiaKey)),
			settle(nodeListSatellites(base.data, domiaKey)),
		])

	const identity = identities.ok
		? identities.value.identities.find((i) => i.domiaKey === domiaKey)
		: undefined

	const checks: SetupCheck[] = []
	checks.push(
		health.ok
			? check("health", health.value.status === "ok" ? "ok" : "warn", null)
			: check("health", "fail", null, health.error),
	)
	checks.push(
		!identities.ok
			? check("identity", "fail", null, identities.error)
			: identity
				? check("identity", "ok", identity.name)
				: check("identity", "fail", null),
	)
	if (configHealth.ok) {
		const entries = configHealth.value.health.entries
		const missing = entries.filter((e) => e.status === "missing")
		checks.push(
			missing.length
				? check(
						"engines",
						"fail",
						missing.map((e) => `${e.stage}: ${e.configured ?? "?"}`).join(", "),
					)
				: check("engines", "ok", `${entries.length}`),
		)
	} else checks.push(check("engines", "fail", null, configHealth.error))
	if (skills.ok) {
		const s = skills.value
		if (!s.skillsEngine) checks.push(check("skills", "warn", null))
		else {
			const down = s.providers.filter((p) => !p.connected)
			checks.push(
				down.length
					? check("skills", "fail", down.map((p) => p.name).join(", "))
					: check("skills", "ok", `${s.providers.length}`),
			)
		}
	} else checks.push(check("skills", "fail", null, skills.error))
	checks.push(
		satellites.ok
			? check(
					"satellites",
					satellites.value.satellites.length ? "ok" : "warn",
					`${satellites.value.satellites.length}`,
				)
			: check("satellites", "fail", null, satellites.error),
	)

	return {
		ok: true,
		data: { domiaKey, name: identity?.name ?? domiaKey, checks },
	}
}
