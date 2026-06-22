import { createDb } from "@domia-app/db/client"
import { env } from "@/config"

export const db = createDb(env.DATABASE_URL)
