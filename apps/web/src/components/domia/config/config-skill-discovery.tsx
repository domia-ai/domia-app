import { Radar, Loader2 } from "lucide-react"
import { useMutation } from "@tanstack/react-query"
import { discoverSkillProvidersFn } from "@/server/skills"
import { errText } from "@/utils/service-errors"
import { m } from "@/paraglide/messages"
import { Button } from "@/components/ui/button"
import type { DiscoveredSkillProvider } from "@/types/skills"

export function SkillProviderDiscovery({
	domiaKey,
	existingUrls,
	onAdd,
}: {
	domiaKey: string
	existingUrls: string[]
	onAdd: (found: DiscoveredSkillProvider) => void
}) {
	const discover = useMutation({
		mutationFn: () => discoverSkillProvidersFn({ data: domiaKey }),
	})
	const discovered: DiscoveredSkillProvider[] = discover.data?.ok
		? (discover.data.data ?? [])
		: []

	return (
		<div className="space-y-2">
			<Button
				type="button"
				variant="outline"
				disabled={discover.isPending}
				onClick={() => discover.mutate()}
			>
				{discover.isPending ? (
					<Loader2 className="size-4 animate-spin" />
				) : (
					<Radar className="size-4" />
				)}
				{m.config_skill_discover()}
			</Button>
			{discover.isError && (
				<p className="text-destructive text-xs">
					{m.config_skill_discover_failed()}
				</p>
			)}
			{discover.data && !discover.data.ok && (
				<p className="text-destructive text-xs">
					{errText(discover.data.error)}
				</p>
			)}
			{discover.data?.ok && discovered.length === 0 && (
				<p className="text-muted-foreground text-xs">
					{m.config_skill_discover_none()}
				</p>
			)}
			{discovered.map((found) => {
				const present = existingUrls.includes(found.url)
				return (
					<div
						key={found.url}
						className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
					>
						<div className="min-w-0">
							<p className="truncate text-sm font-medium">
								{found.name}
								{found.version ? ` · ${found.version}` : ""}
							</p>
							<p className="text-muted-foreground truncate text-xs">
								{found.url}
							</p>
						</div>
						<Button
							type="button"
							size="sm"
							variant="secondary"
							disabled={present}
							onClick={() => onAdd(found)}
						>
							{present ? m.config_skill_discover_added() : m.config_skill_add()}
						</Button>
					</div>
				)
			})}
		</div>
	)
}
