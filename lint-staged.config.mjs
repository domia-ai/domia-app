const quote = (files) => files.map((f) => `"${f}"`).join(" ")

export default {
	"*.{ts,tsx}": (files) => [
		`prettier --write ${quote(files)}`,
		`eslint --fix --no-warn-ignored ${quote(files)}`,
	],
	"*.{md,json,css}": (files) => [`prettier --write ${quote(files)}`],
}
