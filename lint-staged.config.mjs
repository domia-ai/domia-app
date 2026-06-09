const quote = (files) => files.map((f) => `"${f}"`).join(" ")
const notWeb = (files) => files.filter((f) => !f.includes("/apps/web/"))

export default {
	"*.{ts,tsx}": (files) => {
		const tasks = [`prettier --write ${quote(files)}`]
		const lintable = notWeb(files)
		if (lintable.length > 0) {
			tasks.push(`eslint --fix --no-warn-ignored ${quote(lintable)}`)
		}
		return tasks
	},
	"*.{md,json,css}": (files) => [`prettier --write ${quote(files)}`],
}
