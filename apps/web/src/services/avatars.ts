import { mkdirSync, unlinkSync, writeFileSync, readFileSync } from "node:fs"
import { join, resolve, sep } from "node:path"
import { eq } from "drizzle-orm"
import { domiaRegistry } from "@domia-app/db"
import { db } from "@/db"
import { env } from "@/config"
import { CUSTOM_AVATAR_ID, isPresetAvatar } from "@/constants/avatars"
import type { SetAvatarInput, SetAvatarResult } from "@/types/avatars"

const AVATAR_DIR = resolve(env.DOMIA_APP_AVATAR_DIR)
const MAX_AVATAR_BYTES = 2 * 1024 * 1024
const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

const EXT_BY_MIME: Record<string, string> = {
	"image/png": "png",
	"image/jpeg": "jpg",
	"image/webp": "webp",
	"image/gif": "gif",
}

const avatarFilePath = (domiaKey: string, mime: string): string | null => {
	const ext = EXT_BY_MIME[mime]
	if (!ext) return null
	if (domiaKey === "." || domiaKey === ".." || !SAFE_SEGMENT.test(domiaKey))
		return null
	const localPath = join(AVATAR_DIR, `${domiaKey}.${ext}`)
	if (!resolve(localPath).startsWith(AVATAR_DIR + sep)) return null
	return localPath
}

const getRegistryAvatar = async (domiaKey: string) => {
	const [row] = await db
		.select({
			domiaKey: domiaRegistry.domiaKey,
			avatarId: domiaRegistry.avatarId,
			avatarMime: domiaRegistry.avatarMime,
		})
		.from(domiaRegistry)
		.where(eq(domiaRegistry.domiaKey, domiaKey))
		.limit(1)
	return row ?? null
}

const removeStoredFile = (domiaKey: string, mime: string | null) => {
	if (!mime) return
	const localPath = avatarFilePath(domiaKey, mime)
	if (!localPath) return
	try {
		unlinkSync(localPath)
	} catch {
		/* already gone */
	}
}

const setRegistryAvatar = (
	domiaKey: string,
	avatarId: string | null,
	avatarMime: string | null,
) =>
	db
		.update(domiaRegistry)
		.set({ avatarId, avatarMime })
		.where(eq(domiaRegistry.domiaKey, domiaKey))

export const setAvatar = async (
	input: SetAvatarInput,
): Promise<SetAvatarResult> => {
	const current = await getRegistryAvatar(input.domiaKey)
	if (!current) return { ok: false, error: "Domia not found" }

	if (input.kind === "preset") {
		if (!isPresetAvatar(input.presetId))
			return { ok: false, error: "Unknown preset" }
		removeStoredFile(input.domiaKey, current.avatarMime)
		await setRegistryAvatar(input.domiaKey, input.presetId, null)
		return { ok: true, avatarId: input.presetId }
	}

	if (input.kind === "clear") {
		removeStoredFile(input.domiaKey, current.avatarMime)
		await setRegistryAvatar(input.domiaKey, null, null)
		return { ok: true, avatarId: null }
	}

	const localPath = avatarFilePath(input.domiaKey, input.mime)
	if (!localPath) return { ok: false, error: "Unsupported image type" }
	const data = Buffer.from(input.dataBase64, "base64")
	if (data.length === 0) return { ok: false, error: "Empty image" }
	if (data.length > MAX_AVATAR_BYTES)
		return { ok: false, error: "Image too large (max 2MB)" }

	removeStoredFile(input.domiaKey, current.avatarMime)
	mkdirSync(AVATAR_DIR, { recursive: true })
	writeFileSync(localPath, data)
	await setRegistryAvatar(input.domiaKey, CUSTOM_AVATAR_ID, input.mime)
	return { ok: true, avatarId: CUSTOM_AVATAR_ID }
}

export const getDomiaAvatar = async (
	domiaKey: string,
): Promise<{ data: Buffer; mime: string } | null> => {
	const row = await getRegistryAvatar(domiaKey)
	if (!row || row.avatarId !== CUSTOM_AVATAR_ID || !row.avatarMime) return null
	const localPath = avatarFilePath(domiaKey, row.avatarMime)
	if (!localPath) return null
	try {
		return { data: readFileSync(localPath), mime: row.avatarMime }
	} catch {
		return null
	}
}
