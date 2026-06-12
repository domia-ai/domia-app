export function DemoBadge() {
	return (
		<span className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
			Live demo
		</span>
	)
}

export function DemoBanner() {
	return (
		<div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-xs text-amber-700 md:px-6 dark:text-amber-300">
			You are browsing real pipeline data captured from a live 5-Domia home mesh
			— latencies, delegation journeys, memories and emotions are genuine.
			Voices are synthetic. The demo is read-only.
		</div>
	)
}
