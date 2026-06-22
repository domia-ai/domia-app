import { readFileSync, writeFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const coreDir = resolve(here, "../../../../domia-core/templates")
const webDir = resolve(here, "../src/constants/system-templates")
const files = [
	"standalone.json",
	"full-hub.json",
	"thin-client.json",
	"defaults.json",
]
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

if (check && drift) process.exit(1)
if (!drift) console.log("system templates in sync with domia-core")
