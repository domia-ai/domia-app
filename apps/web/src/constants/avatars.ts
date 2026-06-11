import type { AvatarPreset } from "@/types/avatars"

export const CUSTOM_AVATAR_ID = "custom"

export const AVATAR_PRESETS: AvatarPreset[] = [
	{ id: "astronaut", label: "Astronaut" },
	{ id: "chef", label: "Chef" },
	{ id: "doctor", label: "Doctor" },
	{ id: "teacher", label: "Teacher" },
	{ id: "programmer", label: "Programmer" },
	{ id: "gamer", label: "Gamer" },
	{ id: "musician", label: "Musician" },
	{ id: "athlete", label: "Athlete" },
	{ id: "aviator", label: "Aviator" },
	{ id: "architect", label: "Architect" },
	{ id: "mechanic", label: "Mechanic" },
	{ id: "electrician", label: "Electrician" },
	{ id: "accountant", label: "Accountant" },
	{ id: "lawyer", label: "Lawyer" },
	{ id: "investigator", label: "Investigator" },
	{ id: "legendary", label: "Legendary" },
]

const PRESET_IDS = new Set(AVATAR_PRESETS.map((p) => p.id))

export const presetSrc = (id: string): string => `/avatars/${id}.webp`

export const isPresetAvatar = (avatarId: string | null | undefined): boolean =>
	!!avatarId && PRESET_IDS.has(avatarId)

export const isCustomAvatar = (avatarId: string | null | undefined): boolean =>
	avatarId === CUSTOM_AVATAR_ID

export const customAvatarSrc = (domiaKey: string): string =>
	`/api/domias/${encodeURIComponent(domiaKey)}/avatar`
