import { Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { FactsCardProps } from "@/types/conversations"

export function FactsCard({ facts }: FactsCardProps) {
	if (facts.length === 0) return null

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2 text-base">
					<Lightbulb className="size-4" />
					What Domia learned
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				{facts.map((fact) => (
					<div key={fact.id} className="space-y-1 text-sm">
						<p>
							<span className="font-medium">{fact.subject}</span>{" "}
							<span className="text-muted-foreground">{fact.relation}</span>{" "}
							<span className="font-medium">{fact.value}</span>
						</p>
						{fact.confidence != null && (
							<div className="bg-muted h-1 w-full overflow-hidden rounded-full">
								<div
									className="bg-chart-1 h-full"
									style={{ width: `${Math.round(fact.confidence * 100)}%` }}
								/>
							</div>
						)}
					</div>
				))}
			</CardContent>
		</Card>
	)
}
