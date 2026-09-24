import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const settings = JSON.parse(
	readFileSync(resolve(here, "../project.inlang/settings.json"), "utf8"),
)
const { baseLocale, locales } = settings
const pathFor = (locale) => resolve(here, `../messages/${locale}.json`)

const load = (locale) => {
	const raw = readFileSync(pathFor(locale), "utf8")
	const data = JSON.parse(raw)
	const keys = Object.keys(data).filter((k) => k !== "$schema")
	const duplicates = [
		...raw.matchAll(/^\t"([^"]+)":/gm).map((match) => match[1]),
	].filter((key, i, all) => all.indexOf(key) !== i)
	return { data, keys, duplicates: [...new Set(duplicates)] }
}

const base = load(baseLocale)
const problems = []
for (const dup of base.duplicates)
	problems.push(`${baseLocale}: duplicate key "${dup}"`)

for (const locale of locales) {
	if (locale === baseLocale) continue
	const other = load(locale)
	for (const dup of other.duplicates)
		problems.push(`${locale}: duplicate key "${dup}"`)
	for (const key of base.keys)
		if (!(key in other.data)) problems.push(`${locale}: missing "${key}"`)
	for (const key of other.keys)
		if (!(key in base.data)) problems.push(`${locale}: extra "${key}"`)
	for (const key of base.keys) {
		if (!(key in other.data)) continue
		const expected = [
			...String(base.data[key])
				.matchAll(/\{(\w+)\}/g)
				.map((m) => m[1]),
		].sort()
		const actual = [
			...String(other.data[key])
				.matchAll(/\{(\w+)\}/g)
				.map((m) => m[1]),
		].sort()
		if (expected.join(",") !== actual.join(","))
			problems.push(
				`${locale}: "${key}" placeholders {${actual.join(",")}} ≠ {${expected.join(",")}}`,
			)
	}
}

if (problems.length > 0) {
	console.error(`i18n parity failed (${problems.length}):`)
	for (const problem of problems) console.error(`  ${problem}`)
	process.exit(1)
}
console.log(
	`i18n parity ok: ${base.keys.length} keys × ${locales.length} locales`,
)
