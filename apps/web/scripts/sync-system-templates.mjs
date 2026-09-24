import { readdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const coreDir = resolve(here, "../../../../domia-core/templates")
const webDir = resolve(here, "../src/constants/system-templates")
const CONSOLE_ONLY = new Set(["home-assistant.json"])
const files = readdirSync(coreDir)
	.filter((f) => f.endsWith(".json"))
	.sort()
const orphans = readdirSync(webDir)
	.filter((f) => f.endsWith(".json"))
	.filter((f) => !files.includes(f) && !CONSOLE_ONLY.has(f))
	.sort()
const check = process.argv.includes("--check")

let drift = false
for (const file of files) {
	const source = readFileSync(resolve(coreDir, file), "utf8")
	const target = resolve(webDir, file)
	const current = (() => {
		try {
			return readFileSync(target, "utf8")
		} catch {
			return null
		}
	})()
	if (source === current) continue
	drift = true
	if (check) {
		console.error(`✗ ${file} differs from domia-core/templates (run sync)`)
	} else {
		writeFileSync(target, source)
		console.log(`✓ synced ${file}`)
	}
}

for (const file of orphans) {
	drift = true
	console.error(`✗ ${file} has no counterpart in domia-core/templates`)
}

if (check && drift) process.exit(1)
if (!drift) console.log("system templates in sync with domia-core")
