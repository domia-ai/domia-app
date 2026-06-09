import { and, eq } from "drizzle-orm"
import { audioAsset, type AudioAssetRow } from "@domia-app/db"
import { db } from "@/db"

export const getAudioAsset = async (
	interactionId: string,
	kind: "input" | "tts",
): Promise<AudioAssetRow | null> => {
	const [row] = await db
		.select()
		.from(audioAsset)
		.where(
			and(
				eq(audioAsset.interactionId, interactionId),
				eq(audioAsset.kind, kind),
			),
		)
		.limit(1)
	return row ?? null
}
