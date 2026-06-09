import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"

export const createDb = (dbPath: string) => {
	const sqlite = new Database(dbPath)
	sqlite.pragma("journal_mode = WAL")
	sqlite.pragma("synchronous = NORMAL")
	sqlite.pragma("busy_timeout = 5000")
	sqlite.pragma("cache_size = -64000")
	sqlite.pragma("temp_store = MEMORY")
	return drizzle(sqlite, { schema })
}

export type Db = ReturnType<typeof createDb>
