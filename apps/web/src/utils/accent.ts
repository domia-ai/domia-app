const CHART_VARS = [
	"var(--chart-1)",
	"var(--chart-2)",
	"var(--chart-3)",
	"var(--chart-4)",
	"var(--chart-5)",
]

export const accentFor = (key: string): string => {
	let hash = 0
	for (let i = 0; i < key.length; i++) {
		hash = (hash * 31 + key.charCodeAt(i)) >>> 0
	}
	return CHART_VARS[hash % CHART_VARS.length]
}
